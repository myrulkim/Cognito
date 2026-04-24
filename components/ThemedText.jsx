import { Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedText = ({ style, title = false, subtitle = false, ...props }) => {

  const getFontFamily = () => {
    if (title) return 'Roboto-Black'
    if (subtitle) return 'Roboto-Bold'
    return 'Roboto-Regular'
  }

  // Use the new Obsidian Neural design system colors
  const textColor = title ? Colors.text.accent : Colors.text.primary

  return (
    <Text
      style={[
        { color: textColor, fontFamily: getFontFamily() },
        title && styles.title,
        subtitle && styles.subtitle,
        !title && !subtitle && styles.text,
        style
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  text: { fontSize: 16, fontWeight: '400', letterSpacing: -0.2 },
  title: { fontSize: 28, letterSpacing: -1 },
  subtitle: { fontSize: 18, letterSpacing: -0.5 },
});

export default ThemedText