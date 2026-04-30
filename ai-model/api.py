from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import tempfile
import json
import os
import uuid

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_PATH = os.path.join(BASE_DIR, 'process_yolo.py')

UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
ANNOTATED_DIR = os.path.join(UPLOADS_DIR, 'annotated')

os.makedirs(ANNOTATED_DIR, exist_ok=True)

def compute_score(class_percentages):
    total_pct = sum(class_percentages.values())
    return min(99, round(total_pct))

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': '✅ API IA CPV', 'status': 'ok'})

@app.route('/uploads/annotated/<path:filename>', methods=['GET'])
def serve_annotated_image(filename):
    return send_from_directory(ANNOTATED_DIR, filename)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'Aucune image fournie'}), 400

    file = request.files['image']

    tmp_input = None
    tmp_json = None

    try:
        suffix = os.path.splitext(file.filename or '')[1].lower()
        if suffix not in ['.jpg', '.jpeg', '.png', '.webp']:
            suffix = '.jpg'

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_in:
            tmp_input = tmp_in.name
            file.save(tmp_input)

        annotated_filename = f"annotated_{uuid.uuid4().hex}.jpg"
        annotated_output_path = os.path.join(ANNOTATED_DIR, annotated_filename)

        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_out_json:
            tmp_json = tmp_out_json.name

        result = subprocess.run(
            ['python', SCRIPT_PATH, tmp_input, annotated_output_path, tmp_json],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )

        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            raise RuntimeError(result.stderr or "Erreur lors de l'exécution de YOLO")

        if not os.path.exists(tmp_json):
            raise RuntimeError("Le fichier JSON de résultat n'a pas été généré")

        with open(tmp_json, 'r', encoding='utf-8') as f:
            class_percentages = json.load(f)

        print(f"📊 Résultats bruts : {class_percentages}")

        if 'Damage' in class_percentages and 'Physical' not in class_percentages:
            class_percentages['Physical'] = class_percentages.pop('Damage')

        defauts_display = {
            'dommage': round(class_percentages.get('Physical', 0), 1),
            'poussiere': round(class_percentages.get('dust', 0), 1),
            'fientes': round(class_percentages.get('bird', 0), 1),
            'feuilles': round(class_percentages.get('leaf', 0), 1),
            'sable': round(class_percentages.get('snow', 0), 1),
        }

        total_pct = sum(class_percentages.values())
        score = compute_score(class_percentages)
        total_detections = sum(1 for v in class_percentages.values() if v > 0.5)

        if score >= 70:
            niveau = 'critique'
            reco = f"⚠️ Nettoyage immédiat requis. Surface encrassée : {round(total_pct, 1)}%."
        elif score >= 40:
            niveau = 'attention'
            reco = f"📋 Surface encrassée : {round(total_pct, 1)}%. Nettoyage recommandé dans 2 semaines."
        elif score > 5:
            niveau = 'acceptable'
            reco = f"✅ Encrassement faible ({round(total_pct, 1)}%). Prochain nettoyage dans 30 jours."
        else:
            niveau = 'acceptable'
            reco = "✅ Aucun défaut détecté. Panneau propre."

        annotated_relative_url = f"/uploads/annotated/{annotated_filename}"

        return jsonify({
            'success': True,
            'score': score,
            'niveau': niveau,
            'total_detections': total_detections,
            'defauts': defauts_display,
            'detections_count': {k: round(v, 1) for k, v in defauts_display.items()},
            'raw_percentages': class_percentages,
            'recommandation': reco,
            'annotated_image_url': annotated_relative_url,
            'imageAnnotee': annotated_relative_url,
        })

    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        for p in [tmp_input, tmp_json]:
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass

if __name__ == '__main__':
    print("🚀 API IA CPV sur http://localhost:8000")
    print(f"📁 Script : {SCRIPT_PATH}")
    app.run(host='0.0.0.0', port=8000, debug=True)