"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setMessage(result.error);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative size-12 overflow-hidden rounded-xl mb-4 shadow-sm">
            <Image src="/logo.jpg" alt="Levist Uniforms" fill className="object-cover" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Levist Uniforms</h1>
          <p className="text-sm text-muted-foreground mt-1">Accede al panel de administración</p>
        </div>

        <Card>
          <CardHeader className="pb-4 pt-6 px-6">
            <p className="text-sm font-medium text-foreground">Iniciar sesión</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Correo electrónico</Label>
                <Input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  placeholder="usuario@levist.com"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Contraseña</Label>
                <Input
                  id="password" name="password" type="password"
                  autoComplete="current-password" required
                  placeholder="••••••••"
                  className="h-9 text-sm"
                />
              </div>

              {message && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <p className="text-xs text-destructive font-medium">{message}</p>
                </div>
              )}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Iniciando sesión…' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          © {new Date().getFullYear()} Levist Uniforms
        </p>
      </div>
    </div>
  );
}
