import {
  Card,
  CardBody,
  Drawer as BaseDrawer,
  IconButton,
  Typography,
} from '@material-tailwind/react';
import { XIcon } from 'lucide-react';
import React from 'react';

export type DrawerProps = React.ComponentPropsWithRef<typeof BaseDrawer> & {
  title?: string;
};

export const Drawer = ({ title, ...props }: DrawerProps) => {
  return (
    <BaseDrawer placement='left' size={500} {...props}>
      <Card className='h-full'>
        <CardBody className='pb-1'>
          <div className='flex flex-row items-center justify-between'>
            <Typography variant='h5'>{title}</Typography>
            <IconButton variant='text' onClick={props.onClose}>
              <XIcon />
            </IconButton>
          </div>
        </CardBody>
        <CardBody className='h-full overflow-y-auto'>{props.children}</CardBody>
      </Card>
    </BaseDrawer>
  );
};
