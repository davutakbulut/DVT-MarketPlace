import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Tüm alanları doldurmanız gerekmektedir.' }, { status: 400 });
    }

    if (newPassword.length < 1) {
      return NextResponse.json({ error: 'Şifreniz boş olamaz.' }, { status: 400 });
    }

    // Verify token validity in database
    const tokenRows = await query(`
      SELECT id FROM password_reset_tokens
      WHERE email = $1 AND token = $2 AND is_used = false AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1
    `, [email, code.trim()]);

    if (tokenRows.length === 0) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş doğrulama kodu.' }, { status: 400 });
    }

    const tokenId = tokenRows[0].id;

    // Update user password in auth.users using pgcrypto crypt()
    await query(`
      UPDATE auth.users
      SET encrypted_password = crypt($1, gen_salt('bf')), updated_at = now()
      WHERE email = $2
    `, [newPassword, email]);

    // Mark token as used
    await query('UPDATE password_reset_tokens SET is_used = true WHERE id = $1', [tokenId]);

    return NextResponse.json({
      success: true,
      message: 'Şifreniz veritabanında başarıyla güncellendi! Artık yeni şifrenizle giriş yapabilirsiniz.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Şifre güncellenirken hata oluştu.' }, { status: 500 });
  }
}
