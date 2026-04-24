import { View } from 'react-native'
import { Colors } from '../constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ThemedView = ({ style, safe = false, ...props }) => {
  if (!safe) return (
    <View
      style={[{ backgroundColor: Colors.bg.primary }, style]}
      {...props}
    />
  )

  const insets = useSafeAreaInsets()

  return (
    <View
      style={[{
        backgroundColor: Colors.bg.primary,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }, style]}
      {...props}
    />
  )
}

export default ThemedView