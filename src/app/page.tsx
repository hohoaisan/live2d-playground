'use client';

import {
  Button,
  Card,
  CardBody,
  IconButton,
  Input,
  Navbar,
  Typography,
} from '@material-tailwind/react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { XIcon } from 'lucide-react';
import Script from 'next/script';
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Slider } from '@/components';

import { EParam, initialPresets, ParamDef } from '@/constants/enum';

import live2dModel from '../helpers/live2d';

const selectedParams = [
  EParam.ParamAngleX,
  EParam.ParamAngleY,
  EParam.ParamAngleZ,
  EParam.ParamEyeLOpen,
  EParam.ParamEyeLSmile,
  EParam.ParamEyeROpen,
  EParam.ParamEyeRSmile,
  EParam.ParamEyeBallX,
  EParam.ParamEyeBallY,
  EParam.ParamEyeBallForm,
  EParam.ParamBrowLY,
  EParam.ParamBrowRY,
  EParam.ParamBrowLX,
  EParam.ParamBrowRX,
  EParam.ParamBrowLAngle,
  EParam.ParamBrowRAngle,
  EParam.ParamBrowLForm,
  EParam.ParamBrowRForm,
  EParam.ParamMouthForm,
  EParam.ParamMouthOpenY,
  EParam.ParamCheek,
  EParam.ParamBodyAngleX,
  EParam.ParamBodyAngleY,
  EParam.ParamBodyAngleZ,
];

const initState = selectedParams.reduce(
  (s, param) => ({
    ...s,
    [param]: ParamDef[param].default,
  }),
  {} as { [key in EParam]?: number }
);

const Playground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scaleValue, setScaleValue] = useState(1);
  const [motions, setMotions] = useState<string[]>([]);
  const [expressions, setExpressions] = useState<string[]>([]);
  const [state, setState] = useState(initState);
  const [presets, setPresets] = useState<
    {
      name: string;
      state: { [key in EParam]?: number };
    }[]
  >([...initialPresets]);

  useEffect(() => {
    if (canvasRef.current) {
      live2dModel.modelUrl = '/model/hiyori_pro_t11/hiyori_pro_t11.model3.json';
      live2dModel.initialize(canvasRef.current).then(() => {
        const motions = live2dModel.getMotions();
        const expressions = live2dModel.getExpressions();
        setMotions(motions);
        setExpressions(expressions);
        for (const param in state) {
          const value = state[param as EParam];
          value && live2dModel.setParameter(param as EParam, value);
        }
      });
    }
  }, []);

  useEffect(() => {
    live2dModel.changeScale(scaleValue || 2);
  }, [scaleValue]);

  useEffect(() => {
    for (const param in state) {
      const value = state[param as EParam];
      value && live2dModel.setParameter(param as EParam, value);
    }
  }, [state]);

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

  useEffect(() => {
    setPresets(JSON.parse(localStorage.getItem('PRESETS') || '[]') || []);
  }, []);

  useEffect(() => {
    presets && localStorage.setItem('PRESETS', JSON.stringify(presets));
  }, [presets]);

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
            <Card className='aspect-video flex-1'>
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
      <div className='container mx-auto mb-2 px-4'>
        <Card>
          <CardBody>
            <div className='mb-4 flex flex-wrap gap-x-12'>
              {selectedParams.map((paramName) => {
                const param = ParamDef[paramName];
                return (
                  <div
                    key={paramName}
                    className='flex w-full items-center justify-between lg:w-[45%] xl:w-[30%]'
                  >
                    <p>{paramName}</p>
                    <div className='w-40'>
                      <Slider
                        min={param.min}
                        max={param.max}
                        step={(param.max - param.min) / 20}
                        value={[state[paramName] || param.default]}
                        onValueChange={([value]) => {
                          setState((state) => ({
                            ...state,
                            [paramName]: value,
                          }));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className='mb-4 flex gap-2'>
              <Input crossOrigin='' label='Preset' inputRef={inputRef}></Input>
              <div className='w-52'>
                <Button
                  className='w-full'
                  onClick={() => {
                    if (!inputRef.current) return;
                    const name = inputRef.current.value;
                    setPresets((presets) => [
                      ...(presets || []),
                      { name, state },
                    ]);
                    inputRef.current.value = '';
                  }}
                >
                  Add preset
                </Button>
              </div>
            </div>
            <div className='mb-4'>
              <Typography>Presets</Typography>
              <div className='flex flex-wrap gap-1'>
                {presets?.map(({ name, state }, index) => (
                  <Button
                    variant='outlined'
                    className='pr-2'
                    key={index}
                    onClick={() => {
                      setState(state);
                    }}
                  >
                    {name}
                    <IconButton
                      className='ml-4 p-1'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        setPresets([
                          ...presets.slice(0, index),
                          ...presets.slice(index + 1, presets.length),
                        ]);
                      }}
                    >
                      <XIcon />
                    </IconButton>
                  </Button>
                ))}
              </div>
            </div>
            <div className='mb-4'>
              <Button
                onClick={async () => {
                  const zip = new JSZip();
                  if (!canvasRef.current) return;
                  for (const pose of presets || []) {
                    setState(pose.state);
                    // live2dModel.setParameter(param as EParam, value);
                    await new Promise((r) => setTimeout(r, 1000));
                    const file = await live2dModel.extractRenderBlob(
                      canvasRef.current
                    );
                    if (!file) return;
                    const fileName = `image-${pose.name.replaceAll(
                      ' ',
                      '-'
                    )}.png`;
                    zip.file(fileName, file);
                  }
                  // const file = await live2dModel.extractRenderBlob(
                  //   canvasRef.current
                  // );
                  // if (!file) return;
                  // const date = new Date();
                  // const fileName = `image-${date.toTimeString()}.png`;
                  // saveAs(file, fileName);
                  // zip.file(fileName, file);
                  zip.generateAsync({ type: 'blob' }).then((context) => {
                    saveAs(context, 'example.zip');
                  });
                }}
              >
                Zip file
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Playground;
