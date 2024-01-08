import * as SliderPrimitive from '@radix-ui/react-slider';
import { clsx } from 'clsx';
import React from 'react';

export const Slider = (props: SliderPrimitive.SliderProps) => {
  return (
    <SliderPrimitive.Root
      {...props}
      aria-label='value'
      className='relative flex h-5 touch-none items-center'
    >
      <SliderPrimitive.Track className='relative h-1 w-full grow rounded-full bg-gray-200'>
        <SliderPrimitive.Range className='absolute h-full rounded-full bg-gray-600' />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={clsx(
          'block h-4 w-4 rounded-full bg-black',
          'focus:outline-none focus-visible:ring focus-visible:ring-gray-800 focus-visible:ring-opacity-75'
        )}
      />
    </SliderPrimitive.Root>
  );
};
