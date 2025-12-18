'use client';
import { useEffect } from 'react';
import useFluidCursor from '@/hooks/use-fluid-cursor';

const FluidCursor = () => {
    useEffect(() => {
        useFluidCursor();
    }, []);

    return (
        <div className='fixed top-0 left-0 z-0 h-full w-full pointer-events-none'>
            <canvas id='fluid' className='h-full w-full' />
        </div>
    );
};

export default FluidCursor;
