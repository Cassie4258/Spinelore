'use client';
import { usePathname } from 'next/navigation';
import SpineHeader from './SpineHeader';
export default function HeaderSwitch() {
const path = usePathname();
return <SpineHeader compact={path !== '/'} />;
}
