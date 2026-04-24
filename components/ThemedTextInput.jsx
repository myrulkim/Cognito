import { TextInput } from 'react-native'
import { Colors } from '../constants/Colors'

export default function ThemedTextInput({ style, ...props }) {
  return (
    <TextInput
      style={[
        {
          backgroundColor: Colors.bg.elevated,
          color: Colors.text.primary,
          padding: 20,
          borderRadius: 16, // Smoother rounding
          borderWidth: 1,
          borderColor: Colors.border.subtle,
        },
        style
      ]}
      placeholderTextColor={Colors.text.secondary}
      {...props}
    />
  )
}