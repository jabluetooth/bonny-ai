'use client';
import { useEffect, useState } from 'react';
import useFluidCursor from '@/hooks/use-fluid-cursor';

const FluidCursor = () => {
    // Decorative only: skipped for people who ask for reduced motion and on
    // touch-only devices, where there's no cursor to follow.
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(pointer: fine)').matches;
        setEnabled(!reduce && finePointer);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        // useFluidCursor is a WebGL initializer, not a React hook — it only carries the
        // "use" prefix by convention and does not call any React hooks internally.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useFluidCursor();
    }, [enabled]);

    if (!enabled) return null;

    return (
        <div aria-hidden='true' className='fixed top-0 left-0 z-0 h-full w-full pointer-events-none'>
            <canvas id='fluid' className='h-full w-full' />
        </div>
    );
};

export default FluidCursor;
