import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, Pressable, ImageBackground, TextInput, BackHandler } from 'react-native';
import Alarm from 'react-native-alarm-manager'; // The alarm manager is bugged, unable to function properly. Will be fixed in future release.

const parseTime = (timeString, assumedTimeOfDay) => {
    // Validate timeString input
    if (!timeString) return null
    
    const regex = /(\d{1,2})(\d{2})?([a|p]m?)?/
    const noOfDigits = timeString.replace(/[^\d]/g, "").length
    
    if (noOfDigits === 0) return null
    
    // Seconds are unsupported (rare use case in my eyes, feel free to edit)
    if (noOfDigits > 4) return null
    
    // Add a leading 0 to prevent bad regex match (i.e. 100 = 1hr 00min, not 10hr 0min)
    const sanitized = `${noOfDigits === 3 ? "0" : ""}${timeString}`
    .toLowerCase()
    .replace(/[^\dapm]/g, "")
    const parsed = sanitized.match(regex)
    
    if (!parsed) return null
    
    // Clean up and name parsed data
    const {
        input,
        hours,
        minutes,
        meridian
    } = {
        input: parsed[0],
        hours: Number(parsed[1] || 0),
        minutes: Number(parsed[2] || 0),
        // Defaults to pm if user provided assumedTimeOfDay is not am or pm
        meridian: /am/.test(`${parsed[3] || assumedTimeOfDay.toLowerCase()}m`) ?
        "am" : "pm",
    }
    
    // Quick check for valid numbers
    if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) return null
    
    // Convert hours to 24hr format
    const timeOfDay = hours >= 13 ? "pm" : meridian
    const newHours =
    hours >= 13 ?
    hours :
    hours === 12 && timeOfDay === "am" ?
    0 :
    (hours === 12 && timeOfDay === "pm") || timeOfDay === "am" ?
    hours :
    hours + 12
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default class UserControl extends React.Component {
    constructor(props) {
        super(props);
        
        this.updateInput = this.updateInput.bind(this);
        this.storeData = this.storeData.bind(this);
        this.handleBackPress = this.handleBackPress.bind(this);
        
        this.state = { 
            //
            view: 'home', 
            
            cups: null, 
            usedCups: null,
            weight: '',
            exercise: '',
            
            wakeTime: '',
            sleepTime: '',
            nextReminder: '',
            
            modalVisible: false,
        };
    }
    
    componentDidMount() {
        AsyncStorage.getItem('cups')
        .then(cups => {
            if (cups) {
                const [cupCount, usedCups] = cups.split(', ');
                this.setState({ cups: cupCount });
                this.setState({ usedCups, });
            }
        });
        
        const createAlarm = async () => {
            const id = Math.random().toString(16).slice(2);
            await AsyncStorage.setItem('timers', id);
            
            /*Alarm.schedule({
                alarm_time: '12:06:00',
                alarm_title: 'Drink Water!',
                alarm_text: 'It\'s time to drink water!',
                alarm_sound: 'sound',
                alarm_icon: 'icon',
                alarm_sound_loop: true,
                alarm_vibration: true,
                alarm_noti_removable: true,
                alarm_activate: true,
            }, console.log, console.error);*/
        };
        
        createAlarm();
        
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }
    
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }
    
    handleBackPress() {
        this.state.view === 'questionnaire' && this.setState({ view: 'home' });
        return true;
    }
    
    updateInput(type, text) {
        const state = {}; state[type] = ['weight', 'exercise'].includes(type) ? text.trim() : text;
        (['weight', 'exercise'].includes(type) 
        ? ((parseFloat(text) || parseFloat(text) === 0) && !isNaN(text)) || text == ''
        : 1) && this.setState(state);
    }
    
    storeData() {
        if (!this.state.weight || !this.state.exercise) return;
        this.state.wakeTime = parseTime(this.state.wakeTime, 'am');
        this.state.sleepTime = parseTime(this.state.sleepTime, 'pm');
        
        this.state.cups = Math.round(((parseFloat(this.state.weight) / 2) + ((parseFloat(this.state.exercise) / 30) * 12)) / 8);
        let hours = new Date('1/1/1970 ' + this.state.wakeTime).getHours() - new Date('1/1/1970 ' + this.state.sleepTime).getHours();
        if (hours < 0) hours += 24;
        const interval = (hours / this.state.cups) * 3.6e6;
        
        const nextReminder = new Date(Date.now() + interval);
        this.setState({ nextReminder: `${nextReminder.getHours().toString().padStart(2, '0')}:${nextReminder.getMinutes().toString().padStart(2, '0')}:${nextReminder.getSeconds().toString().padStart(2, '0')}` });
        
        AsyncStorage.multiSet([
            ['weight', this.state.weight],
            ['exercise', this.state.exercise],
            ['cups', `${this.state.cups.toString()}, 0`],
            ['interval', interval.toString()],
            ['timers', ''],
        ])
        .then(() => {
            // fire alarm, set next reminder state
            /*const createAlarm = async () => {
                const id = Math.random().toString(16).slice(2);
                await AsyncStorage.setItem('timers', id);
                
                AlarmNotification.scheduleAlarm({
                    id,
                    title: 'Drink Water!',
                    message: 'It\'s time to drink water.',
                    channel: 'alarm-channel',
                    ticker: 'It\'s time to drink water.',
                    auto_cancel: false,
                    vibrate: true,
                    vibration: 100,
                    color: 'red',
                    small_icon: 'ic_launcher',
                    play_sound: true,
                    sound_name: null,
                    schedule_once: true,
                    fire_date: AlarmNotification.parseDate(new Date(Date.now() + interval)),
                });
                
                // when alarm is fired, set next reminder date
            };
            
            createAlarm();
            setInterval(createAlarm, interval);*/
            
            this.setState({ view: 'home' });
        });
    }
    
    render() {
        AsyncStorage.clear();
        switch (this.state.view) {
            case 'home': {
                if (this.state.cups && !isNaN(this.state.cups)) {
                    return (
                        <>
                        <ImageBackground style={Styles.WaterCup} source={require('../assets/images/icon.png')}>
                        <Text style={{ flex: 1, top: '30%', textAlign: 'center', fontFamily: 'Ubuntu', fontSize: 18, fontWeight: 'bold' }}>You have to drink{'\n'}
                        <Text style={{ fontFamily: 'Ubuntu', fontSize: 72, fontWeight: 'bold', color: 'red', }}>{this.state.cups - this.state.usedCups}{'\n'}</Text>cups of water today.
                        {'\n'}
                        {'\n'}
                        {'\n'}
                        Next reminder: {'\n'}
                        <Text style={{ fontFamily: 'Ubuntu', fontSize: 36, fontWeight: 'bold', color: 'red', }}>{this.state.nextReminder}</Text>
                        </Text>                                    
                        </ImageBackground>
                        </>
                        )
                    } else {
                        return (
                            <>
                            <ImageBackground style={Styles.WaterCup} source={require('../assets/images/icon.png')}>
                            <Pressable onPress={() => { this.setState({ view: 'questionnaire' }) }}>
                            <Text style={{ fontFamily: 'Ubuntu', fontSize: 36, fontWeight: 'bold' }}>GET STARTED</Text>
                            </Pressable>
                            </ImageBackground>
                            </>
                            )
                        }
                    }
                    case 'questionnaire': {
                        return (
                            <>
                            <TextInput style={Styles.FormField} placeholder="Weight (in lbs.)" onChangeText={t => this.updateInput('weight', t)} value={this.state.weight} />   
                            <TextInput style={Styles.FormField} placeholder="Time of Exercise (in minutes)" onChangeText={t => this.updateInput('exercise', t)} value={this.state.exercise} /> 
                            <TextInput style={Styles.FormField} placeholder="Waking Time (Format: HH:MM AM/PM)" onChangeText={t => this.updateInput('wakeTime', t)} value={this.state.wakeTime} />  
                            <TextInput style={Styles.FormField} placeholder="Sleeping Time (Format: HH:MM AM/PM)" onChangeText={t => this.updateInput('sleepTime', t)} value={this.state.sleepTime} />  
                            <Pressable style={Styles.Button} onPress={this.storeData.bind(this)}>
                            <Text style={{ fontFamily: 'Ubuntu', fontSize: 36, fontWeight: 'bold' }}>SUBMIT</Text>
                            </Pressable>  
                            </>           
                            )
                        }
                    }
                }
            }
            
            const Styles = StyleSheet.create({
                FormField: {
                    margin: 10,
                    padding: 15,
                    fontSize: 16,
                    fontFamily: 'Ubuntu',
                    backgroundColor: 'white'
                },
                WaterCup: {   
                    flex: 1,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                Button: {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxHeight: '10%',
                    maxWidth: '100%',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                },
            });