const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'experiences.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cambiame';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

const load = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).map(normalize);
const save = (list) => fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));

// Protección simple con contraseña para el editor y la API de escritura
function auth(req, res, next) {
  const [type, b64] = (req.headers.authorization || '').split(' ');
  if (type === 'Basic' && b64) {
    const pass = Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':');
    const a = Buffer.from(pass), b = Buffer.from(ADMIN_PASSWORD);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Editor"').status(401).send('Se requiere contraseña');
}

const ALLOWED = ['.mind', '.mp4', '.webm', '.png', '.jpg', '.jpeg', '.webp', '.gif'];
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
    }
  }),
  fileFilter: (req, file, cb) =>
    cb(null, ALLOWED.includes(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Convierte experiencias antiguas (un video + textos) al formato de elementos
function normalize(e) {
  if (!Array.isArray(e.elements)) {
    e.elements = [];
    if (e.videoSrc) e.elements.push({ type: 'video', src: e.videoSrc, texts: {} });
    if (e.texts && Object.keys(e.texts).length) e.elements.push({ type: 'text', src: '', texts: e.texts });
  }
  return e;
}
const cleanEl = (x = {}) => ({
  type: ['video', 'image', 'text'].includes(x.type) ? x.type : 'text',
  src: String(x.src || ''),
  texts: typeof x.texts === 'object' && x.texts ? x.texts : {}
});
const clean = (b = {}) => ({
  name: String(b.name || 'Sin nombre').slice(0, 100),
  targetSrc: String(b.targetSrc || ''),
  silhouetteSrc: String(b.silhouetteSrc || ''),
  elements: (Array.isArray(b.elements) ? b.elements : []).slice(0, 30).map(cleanEl)
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/experiences', (req, res) => res.json(load()));

app.post('/api/experiences', auth, (req, res) => {
  const list = load();
  const exp = { id: 'exp-' + Date.now().toString(36), ...clean(req.body) };
  list.push(exp); save(list); res.json(exp);
});

app.put('/api/experiences/:id', auth, (req, res) => {
  const list = load();
  const i = list.findIndex(e => e.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'No existe' });
  list[i] = { id: list[i].id, ...clean(req.body) };
  save(list); res.json(list[i]);
});

app.delete('/api/experiences/:id', auth, (req, res) => {
  save(load().filter(e => e.id !== req.params.id));
  res.json({ ok: true });
});

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Archivo no permitido');
  res.json({ url: '/uploads/' + req.file.filename });
});

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', auth, express.static(path.join(__dirname, 'admin')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log('Servidor listo en el puerto ' + PORT));
