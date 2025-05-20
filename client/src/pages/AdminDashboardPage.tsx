import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserResponse } from '@shared/schema';

export function AdminDashboardPage() {
  const { data: users } = useQuery<UserResponse[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/auth/users', {
        credentials: 'include',
        headers: new Headers(),
      });
      return response.json();
    },
  });

  const handleDeleteUser = async (userId: number) => {
    await fetch(`http://localhost:3000/api/auth/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: new Headers(),
    });
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {users?.map((user) => (
        <div key={user.id}>
          <span>{user.displayName}</span>
          <Button onClick={() => handleDeleteUser(user.id)}>Delete</Button>
        </div>
      ))}
    </div>
  );
}
