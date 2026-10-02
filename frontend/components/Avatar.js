export default function Avatar({ user, size = 36 }) {
  const letter = (user?.username || '?').charAt(0).toUpperCase();
  return (
    <span className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : letter}
    </span>
  );
}
