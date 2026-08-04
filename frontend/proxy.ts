import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/profile', '/animals/new'];
const RESCUER_ONLY_PATHS = ['/animals/new'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const role = request.cookies.get('pc_role')?.value;

  if (!role) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isRescuerOnly = RESCUER_ONLY_PATHS.some((path) => pathname.startsWith(path));
  if (isRescuerOnly && role !== 'RESCATISTA') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/profile', '/profile/:path*', '/animals/new'],
};
