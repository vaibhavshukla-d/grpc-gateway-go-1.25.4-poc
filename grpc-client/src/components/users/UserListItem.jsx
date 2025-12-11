export default function UserListItem({ user }) {
  return (
    <li>
      {user.id} — {user.name}
    </li>
  );
}
