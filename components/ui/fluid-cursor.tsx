'use client';
import { useEffect } from 'react';
import useFluidCursor from '@/hooks/use-fluid-cursor';

const FluidCursor = () => {
    useEffect(() => {
        // useFluidCursor is a WebGL initializer, not a React hook — it only carries the
        // "use" prefix by convention and does not call any React hooks internally.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useFluidCursor();
    }, []);

    return (
        <div className='fixed top-0 left-0 z-0 h-full w-full pointer-events-none'>
            <canvas id='fluid' className='h-full w-full' />
        </div>
    );
};

export default FluidCursor;
