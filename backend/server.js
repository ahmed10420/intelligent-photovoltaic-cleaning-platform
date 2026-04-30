const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/centrals', require('./routes/centrals'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/cleanings', require('./routes/cleaning'));
app.use('/api/users', require('./routes/users'))

app.get('/', (req, res) => {
  res.json({ message: '✅ API CPV Spectra - OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur http://localhost:${PORT}`));
