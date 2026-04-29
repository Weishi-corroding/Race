import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '@/screens/HomeScreen'
import LoginScreen from '@/screens/LoginScreen'
import AdminScreen from '@/screens/AdminScreen'

export type RootStackParamList = {
  Home: undefined
  Login: undefined
  Admin: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
    </Stack.Navigator>
  )
}
