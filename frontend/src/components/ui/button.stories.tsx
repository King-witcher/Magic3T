import { Story, StoryDefault } from '@ladle/react'
import { Button as ButtonComponent, ButtonProps } from './button'
import { Panel } from './panel'

export default {
  decorators: [
    (Component) => (
      <Panel className="w-140 h-100 flex flex-col gap-2 items-center justify-center">
        <Component />
      </Panel>
    ),
  ],
} satisfies StoryDefault

export const Button: Story<{
  text: string
  variant: ButtonProps['variant']
  size: ButtonProps['size']
}> = ({ variant, size, text }) => (
  <ButtonComponent variant={variant} size={size}>
    {text}
  </ButtonComponent>
)

Button.argTypes = {
  variant: {
    control: { type: 'select' },
    options: ['primary', 'secondary', 'destructive', 'ghost', 'outline'],
    defaultValue: 'primary',
  },
  text: {
    control: { type: 'text' },
    defaultValue: 'Click Me',
  },
  size: {
    control: { type: 'select' },
    options: ['sm', 'md', 'lg'],
    defaultValue: 'md',
  },
}
