import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';

import UserControl from './components/UserControl';

export default function App() {
  const [loaded] = useFonts({
    Ubuntu: require('./assets/fonts/Ubuntu.ttf')
  });

  if (!loaded) return;

  return (
    <View style={Styles.Body}>
      <View style={Styles.TitleContainer}>
        <Text style={Styles.TitleBody}>Water Tracker</Text>
        <Text style={Styles.TitleCaption}>Track your daily water intake!</Text>
      </View>
      <UserControl />
    </View>
  );
}

const Styles = StyleSheet.create({
  Body: {
    flex: 1,
    backgroundColor: '#56c6e8',
  },
  TitleContainer: {
    width: '100%',
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  TitleBody: {
    fontSize: 50,
    fontFamily: 'Ubuntu',
  },
  TitleCaption: {
    fontSize: 20,
    fontFamily: 'Ubuntu',
  }
});