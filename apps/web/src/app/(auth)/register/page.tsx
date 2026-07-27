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
  name: z.string().min(2, 'Informe seu nome.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(12, 'Use ao menos 12 caracteres.'),
  organizationName: z.string().min(2, 'Informe o nome da empresa.'),
  organizationSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use minúsculas, números e hífens.')
    .optional()
    .or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;
export default function RegisterPage() {
  const router = useRouter();
  const setSession = useSessionStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const submit = async (values: FormValues) => {
    try {
      const session = await authApi.register({
        ...values,
        organizationSlug: values.organizationSlug || undefined,
      });
      setSession(session);
      toast.success('Organização criada com sucesso.');
      router.replace('/app/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a organização.');
    }
  };
  return (
    <section className="auth-card">
      <Link href="/" className="brand auth-brand">
        <span>c</span> CRM Inteligente
      </Link>
      <div>
        <p className="eyebrow">Comece agora</p>
        <h1>Crie sua operação</h1>
        <p className="muted">O primeiro usuário será proprietário da organização.</p>
      </div>
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="form-stack">
        <label>
          Seu nome
          <Input autoComplete="name" {...register('name')} />
          {errors.name && <small>{errors.name.message}</small>}
        </label>
        <label>
          E-mail
          <Input type="email" autoComplete="email" {...register('email')} />
          {errors.email && <small>{errors.email.message}</small>}
        </label>
        <label>
          Senha
          <Input type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <small>{errors.password.message}</small>}
        </label>
        <label>
          Nome da organização
          <Input {...register('organizationName')} />
          {errors.organizationName && <small>{errors.organizationName.message}</small>}
        </label>
        <label>
          Endereço da organização <em>(opcional)</em>
          <Input placeholder="minha-empresa" {...register('organizationSlug')} />
          {errors.organizationSlug && <small>{errors.organizationSlug.message}</small>}
        </label>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar organização'}
        </Button>
      </form>
      <p className="muted auth-footer">
        Já possui acesso? <Link href="/login">Entrar</Link>
      </p>
    </section>
  );
}
