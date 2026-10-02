import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import { getCurrentUser } from '../lib/auth';
import { BASE_URL } from '../lib/constants';

// Redimensiona a imagem no navegador e devolve como data URL (base64),
// pra não precisar de servidor de upload/armazenamento de arquivos.
function resizeImageToDataUrl(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Account() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ avatarUrl: '', coverUrl: '', bio: '', location: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.push('/login');
      return;
    }
    setUser(current);
    setCheckedAuth(true);

    fetch(`${BASE_URL}/users/${current.id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          avatarUrl: data.avatarUrl || '',
          coverUrl: data.coverUrl || '',
          bio: data.bio || '',
          location: data.location || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  }

  async function handleFileChange(e, field, maxWidth) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem (jpg, png, etc).');
      return;
    }

    setUploading(field);
    setError('');
    try {
      const dataUrl = await resizeImageToDataUrl(file, maxWidth);
      setForm((f) => ({ ...f, [field]: dataUrl }));
      setSaved(false);
    } catch (err) {
      setError('Não foi possível carregar essa imagem.');
    } finally {
      setUploading('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    try {
      const res = await fetch(`${BASE_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar perfil');

      setSaved(true);
    } catch (err) {
      setError(typeof err.message === 'string' ? err.message : 'Erro ao salvar perfil');
    }
  }

  if (!checkedAuth) return null;

  return (
    <div className="container">
      <Nav />
      <h1>Editar perfil</h1>
      <p style={{ fontSize: 14, marginBottom: 16 }}>Personalize seu perfil com uma foto e uma capa.</p>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>Foto de perfil</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatarUrl', 400)} />
          {uploading === 'avatarUrl' && <div style={{ fontSize: 12, marginTop: 4 }}>Carregando imagem...</div>}
          {form.avatarUrl && <img src={form.avatarUrl} alt="Prévia do avatar" className="avatar-preview" />}

          <label>Capa do perfil</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverUrl', 1200)} />
          {uploading === 'coverUrl' && <div style={{ fontSize: 12, marginTop: 4 }}>Carregando imagem...</div>}
          {form.coverUrl && <img src={form.coverUrl} alt="Prévia da capa" className="cover-preview" />}

          <label>Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            maxLength={280}
            placeholder="Fala um pouco sobre você e seus gostos em jogos..."
          />
          <div style={{ fontSize: 11, color: '#777', textAlign: 'right' }}>{form.bio.length}/280</div>

          <label>Onde mora</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="Cidade, Estado" />

          <div className="form-buttons">
            <button type="submit" disabled={!!uploading}>Salvar perfil</button>
          </div>

          {saved && <div style={{ color: '#0a7d2a', fontSize: 13, marginTop: 8, fontWeight: 600 }}>Perfil salvo!</div>}
          {error && <div className="error">{error}</div>}
        </form>
      )}
    </div>
  );
}
