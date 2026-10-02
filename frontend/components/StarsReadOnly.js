export default function StarsReadOnly({ value = 0, size = 14 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= value ? '#000' : '#ccc' }}>
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
