'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Yükleniyor animasyonu icin

// Not: Bu bileşeni kullanabilmek icin StatusMessage bileşeninin de tanimlanmis olmasi gerekir.
// StatusMessage bileşeni en altta eklenmiştir.

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token'); // URL'den token'i alıyoruz
    const invitedEmail = searchParams.get('email'); // URL'den email'i de aliyoruz

    const [formData, setFormData] = useState({
        email: invitedEmail || '', // Email'i URL'den al, yoksa boş bırak
        password: '',
        confirmPassword: '',
    });
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'form'>('loading');
    const [message, setMessage] = useState('Davet bilgileri doğrulanıyor...');
    const [loading, setLoading] = useState(false);

    // İlk yüklemede token ve email kontrolü
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Davet tokenı URL\'de bulunamadı. Lütfen geçerli bir davet linki kullandığınızdan emin olun.');
        } else if (!invitedEmail) {
            // Eğer email URL'den gelmezse, kullanıcının girmesi gerekir
            setMessage('Token doğrulandı. Lütfen e-posta adresinizi ve yeni şifrenizi girin.');
            setStatus('form');
        } else {
            // Token ve Email var, formu göstermeye hazırız
            setMessage(`Davet ${invitedEmail} için hazırlanıyor.`);
            setStatus('form');
        }
    }, [token, invitedEmail]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) return;

        if (formData.password !== formData.confirmPassword) {
            setMessage('Hata: Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        setMessage('Hesabınız oluşturuluyor...');
        setStatus('loading'); // Yükleniyor durumunu göster
        
        try {
            const payload = {
                token: token,
                email: formData.email, // Kullanıcının girdiği veya URL'den gelen email
                password: formData.password
            };

            const response = await axios.post('/api/auth/accept-invite', payload);

            if (response.status === 200) {
                setStatus('success');
                setMessage('Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
            }
        } catch (err) {
            console.error('Davet kabul hatası:', err);
            const errorMsg = axios.isAxiosError(err) && err.response?.data?.error 
                             ? err.response.data.error 
                             : 'Hesap oluşturulurken beklenmedik bir hata oluştu.';
            setStatus('error');
            setMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Render Mantığı ---

    // Hata ve Başarı Durumları
    if (status === 'error') {
        return <StatusMessage title="Hata" message={message} color="bg-red-500" />;
    }
    
    if (status === 'success') {
        return (
            <StatusMessage title="Başarılı!" message={message} color="bg-green-600">
                <Link href="/auth/login" className="mt-4 underline text-black">Giriş Yapmak İçin Tıklayın</Link>
            </StatusMessage>
        );
    }
    
    // Yükleme Durumu
    if (status === 'loading') {
        return (
            <StatusMessage title="İşleniyor" message="Davetiniz doğrulanıyor ve hesabınız oluşturuluyor..." color="bg-gray-700">
                <Loader2 className="w-8 h-8 mt-4 animate-spin text-white" />
            </StatusMessage>
        );
    }

    // Normal Form (status === 'form')
    return (
        <div className="flex items-center justify-center py-12 min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-gray-100">
                <h1 className="text-3xl font-bold text-center text-gray-900">Daveti Kabul Et</h1>
                <p className="text-sm text-center text-gray-500">{message}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="grid gap-2">
                        <Label htmlFor="email">Davet Edilen E-posta</Label>
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="Davet edildiğiniz e-posta adresini girin" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            disabled={loading || !!invitedEmail} // URL'den geldiyse düzenlenemesin
                            className={!!invitedEmail ? 'bg-gray-100' : ''}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="password">Yeni Şifre</Label>
                        <Input 
                            id="password" 
                            name="password" 
                            type="password" 
                            placeholder="En az 8 karakter"
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                        <Input 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            type="password" 
                            placeholder="Şifreyi tekrar girin"
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            disabled={loading}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Hesabı Oluştur ve Giriş Yap'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// Durum Mesajı Alt Bileşeni (Stil Tutarlılığı İçin)
const StatusMessage = ({ title, message, color, children }:{title:string;message:string;color:string}) => (
    <div className={`flex flex-col items-center justify-center min-h-screen ${color} p-4`}>
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">{title}</h1>
            <p className="text-gray-700">{message}</p>
            {children}
        </div>
    </div>
);