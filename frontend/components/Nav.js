import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getCurrentUser, clearCurrentUser } from '../lib/auth';

export default function Nav() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleLogout() {
    clearCurrentUser();
    setUser(null);
    router.push('/');
  }

  return (
    <div className="nav">
      <div className="nav-links">
        <Link href="/" className="nav-brand">GameVault</Link>
        <Link href="/explore">Explorar</Link>
        {user && <Link href="/library">Minha biblioteca</Link>}
        {user && <Link href="/dashboard">Dashboard</Link>}
        <Link href="/profiles">Perfis</Link>
        {user && <Link href={`/profile?id=${user.id}`}>Meu perfil</Link>}
      </div>
      <div className="nav-user">
        {user ? (
          <>
            <span className="nav-username">{user.username}</span>
            <button className="secondary" onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <>
            <Link href="/login"><button className="secondary">Entrar</button></Link>
            <Link href="/register"><button>Criar conta</button></Link>
          </>
        )}
      </div>
    </div>
  );
}
