'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignupPage() {
    return (
    <div className="container mx-auto max-w-sm py-8 px-4 h-full flex flex-col justify-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">Join Today</h1>
        <p className="text-muted-foreground mt-2">
           This feature is for demonstration purposes only in the frontend version.
        </p>
      </header>
       <div className="space-y-4">
        <Button disabled className="w-full">Sign Up</Button>
         <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
            Log In
            </Link>
        </p>
      </div>
    </div>
  );
}
