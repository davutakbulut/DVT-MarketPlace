import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Lütfen geçerli bir e-posta adresi girin.' }, { status: 400 });
    }

    // Check if user exists in auth.users
    const userRows = await query('SELECT id, email FROM auth.users WHERE email = $1', [email]);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' }, { status: 404 });
    }

    // Generate 6-digit secure code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire old unused tokens for this email
    await query('UPDATE password_reset_tokens SET is_used = true WHERE email = $1', [email]);

    // Insert new reset token valid for 15 minutes
    await query(`
      INSERT INTO password_reset_tokens (email, token, expires_at)
      VALUES ($1, $2, now() + interval '15 minutes')
    `, [email, resetCode]);

    return NextResponse.json({
      success: true,
      message: '6 haneli şifre sıfırlama doğrulama kodu oluşturuldu.',
      code: resetCode, // Returned for instant testing and simulated email delivery
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
