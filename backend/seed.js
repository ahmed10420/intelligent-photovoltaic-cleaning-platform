const mongoose = require('mongoose');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connecté à MongoDB');
  console.log('✅ Aucun seed exécuté');
  process.exit();
};

seed().catch(e => {
  console.error(e);
  process.exit(1);
});