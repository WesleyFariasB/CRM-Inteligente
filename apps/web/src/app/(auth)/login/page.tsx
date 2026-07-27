'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { authApi } from '../../../lib/api-client';
import { useSessionStore } from '../../../stores/session-store';
const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
  organizationSlug: z.string().min(2, 'Informe a organização.'),
});
type FormValues = z.infer<typeof schema>;
export default function LoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const submit = async (values: FormValues) => {
    try {
      const session = await authApi.login(values);
      setSession(session);
      toast.success(`Bem-vindo, ${session.user.name}!`);
      router.replace('/app/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível entrar.');
    }
  };
  return (
    <section className="auth-card">
      <Link href="/" className="brand auth-brand">
        <span>c</span> CRM Inteligente
      </Link>
      <div>
        <p className="eyebrow">Acesso seguro</p>
        <h1>Boas-vindas de volta</h1>
        <p className="muted">Entre para continuar sua operação comercial.</p>
      </div>
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="form-stack">
        <label>
          Organização
          <Input
            placeholder="minha-empresa"
            autoComplete="organization"
            {...register('organizationSlug')}
          />
          {errors.organizationSlug && <small>{errors.organizationSlug.message}</small>}
        </label>
        <label>
          E-mail
          <Input type="email" autoComplete="email" {...register('email')} />
          {errors.email && <small>{errors.email.message}</small>}
        </label>
        <label>
          Senha
          <Input type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <small>{errors.password.message}</small>}
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar na conta'}
        </Button>
      </form>
      <p className="muted auth-footer">
        Ainda não usa o CRM? <Link href="/register">Criar organização</Link>
      </p>
    </section>
  );
}
