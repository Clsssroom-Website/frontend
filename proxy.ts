import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các route không yêu cầu đăng nhập
const publicRoutes = ['/', '/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Giả lập lấy token đăng nhập (Có thể lấy từ cookies: request.cookies.get('token'))
  // Ở đây nếu bạn dùng JWT, thay đổi logic check auth ở đây.
  const token = request.cookies.get('token')?.value || '';
  const isAuthenticated = !!token;

  const isPublicRoute = publicRoutes.includes(pathname);

  // Nếu chưa đăng nhập và cố vào các trang bảo vệ (dashboard, courses, v.v...)
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Nếu ĐÃ đăng nhập mà cố vào trang login/register thì đưa thẳng vào dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match tất cả requests đường dẫn ngoại trừ các API routes, 
     * _next/static (static files), _next/image (image optimization files), favicon.ico, images...
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};