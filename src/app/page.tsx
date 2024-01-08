'use client';

import {
  Button,
  Card,
  CardBody,
  Input,
  Navbar,
  Typography,
} from '@material-tailwind/react';
import Script from 'next/script';
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import live2dModel from '../helpers/live2d';

const Playground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleValue, setScaleValue] = useState(2);
  const [motions, setMotions] = useState<string[]>([]);
  const [expressions, setExpressions] = useState<string[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      live2dModel.modelUrl = '/model/hiyori_pro_t11/hiyori_pro_t11.model3.json';
      live2dModel.initialize(canvasRef.current).then(() => {
        const motions = live2dModel.getMotions();
        const expressions = live2dModel.getExpressions();
        setMotions(motions);
        setExpressions(expressions);
      });
    }
  }, []);

  useEffect(() => {
    live2dModel.changeScale(scaleValue || 2);
  }, [scaleValue]);

  const onZipUploadChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      const files = event.target.files;
      const file = files?.[0];
      if (!file) return;
      await live2dModel.loadModel([file]);
      const motions = live2dModel.getMotions();
      const expressions = live2dModel.getExpressions();
      setMotions(motions);
      setExpressions(expressions);
    },
    []
  );

  const onMotionClick = useCallback((motion: string) => {
    live2dModel.playMotion(motion);
  }, []);

  const onExpressionClick = useCallback((e: string) => {
    live2dModel.changeExpression(e);
  }, []);

  return (
    <div>
      <Script src='/js/live2d.min.js' async />
      <Script src='/js/live2dcubismcore.min.js' async />
      <Navbar className='mx-auto mb-2 w-full'>
        <div className='text-blue-gray-900 container mx-auto flex items-center justify-between'>
          <Typography as='a' href='#'>
            Live2D Model Playground
          </Typography>
        </div>
      </Navbar>
      <div className='container mx-auto mb-2 px-4'>
        <div className='flex flex-col gap-2 lg:flex-row'>
          <div className='w-full lg:w-[50%] xl:w-fit'>
            <Card className='aspect-video flex-1 bg-black'>
              <canvas
                ref={canvasRef}
                className='h-full w-full'
                width={1280}
                height={720}
              />
            </Card>
          </div>
          <Card className='w-full lg:w-[50%] xl:w-[450px]'>
            <CardBody>
              <div className='mb-4'>
                <Input
                  label='Upload model'
                  variant='static'
                  type='file'
                  accept='.zip'
                  crossOrigin=''
                  onChange={onZipUploadChange}
                />
              </div>
              <div className='mb-4'>
                <Input
                  label='Scale value'
                  variant='static'
                  crossOrigin=''
                  value={scaleValue}
                  type='number'
                  step={0.1}
                  onChange={(e) => setScaleValue(Number(e.target.value))}
                />
              </div>
              <div className='mb-4'>
                <Typography>Motions</Typography>
                <div className='flex flex-wrap gap-1'>
                  {motions.map((motion) => (
                    <Button key={motion} onClick={() => onMotionClick(motion)}>
                      {motion || 'NO NAME'}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Typography>Expressions</Typography>
                <div className='flex flex-wrap gap-1'>
                  {expressions.map((exp) => (
                    <Button key={exp} onClick={() => onExpressionClick(exp)}>
                      {exp || 'NO NAME'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Playground;
