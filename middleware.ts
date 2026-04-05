import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/studio') {
    const url = request.nextUrl.clone();
    url.pathname = '/studio-fixed';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/studio'],
};
