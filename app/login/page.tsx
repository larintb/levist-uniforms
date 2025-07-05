// app/login/page.tsx
"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image'; // Importamos el componente Image
import { login } from './actions';

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const inputStyle = "block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-00 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const primaryButtonStyle = "w-full flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed";

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setMessage(null);

        startTransition(async () => {
            const result = await login(formData);
            if (result?.error) {
                setMessage(result.error);
            }
        });
    };

    return (
        <div className="flex min-h-screen flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Image
                    className="mx-auto h-20 w-auto"
                    src="/logo.jpg"
                    alt="Levist Uniforms Logo"
                    width={80}
                    height={80}
                />
                <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Levist Uniforms Admin
                </h2>
                <p className="mt-2 text-sm text-center text-gray-600">
                    Inicia sesión para gestionar tu tienda
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white px-6 py-12 shadow-lg ring-1 ring-gray-900/5 sm:rounded-2xl sm:px-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Correo electrónico
                            </label>
                            <div className="mt-2">
                                <input id="email" name="email" type="email" autoComplete="email" required className={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Contraseña
                            </label>
                            <div className="mt-2">
                                <input id="password" name="password" type="password" autoComplete="current-password" required className={inputStyle} />
                            </div>
                        </div>
                        
                        {message && (
                            <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">{message}</p>
                        )}
                        
                        <div>
                            <button type="submit" disabled={isPending} className={primaryButtonStyle}>
                                {isPending ? "Iniciando..." : "Iniciar Sesión"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
