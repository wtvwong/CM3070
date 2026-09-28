import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { scheduleNotification, setNotificationHandler } from './notificationsHelper';

setNotificationHandler();

// Alerts screen
function AlertsScreen() {
  const [location, setLocation] = useState(null);
  const [cityName, setCityName] = useState('Unknown location');
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [errorMsg, setErrorMsg] = useState(null);
  const [alert, setAlert] = useState(null); // { type, title, message }

  // Request permission + get location on mount
  useEffect(() => {
    (async () => {
      // 1. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied.');
        return;
      }

      // 2. Get current coordinates
      const current = await Location.getCurrentPositionAsync({});
      setLocation(current.coords);

      // 3. Reverse-geocode to get a human-readable city name
      const places = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      if (places && places.length > 0) {
        const place = places[0];
        // Build a readable name from whatever fields are available
        const name = [place.city, place.region, place.country]
          .filter(Boolean)
          .join(', ');
        setCityName(name || 'Unknown location');
      }
    })();
  }, []);

  // Simulate an emergency alert
  const simulateAlert = async (type) => {
  const alerts = {
    flood: {
      title: 'FLOOD Warning',
      message: `A flood warning has been issued for ${cityName}. Move to higher ground and avoid floodwaters.`,
    },
    hurricane: {
      title: 'HURRICANE Warning',
      message: `A hurricane warning has been issued for ${cityName}. Secure your home and prepare to evacuate.`,
    },
    heatwave: {
      title: 'HEATWAVE Warning',
      message: `An extreme heat warning has been issued for ${cityName}. Stay hydrated and avoid going outdoors.`,
    },
  };

  const chosen = alerts[type];

  // 1. Show in-app banner (always works)
  setAlert({ type, ...chosen });

  // 2. Try to send a system notification using the safe helper
  await scheduleNotification(chosen.title, chosen.message);
};

  return (
    <ScrollView
      style={styles.alertsContainer}
      contentContainerStyle={styles.alertsContent}
    >
      {/* Current location display */}
      <Text style={styles.alertsSectionTitle}>Your Current Location</Text>
      <View style={styles.locationBox}>
        <Text style={styles.locationCity}>{cityName}</Text>
        {location && (
          <Text style={styles.locationCoords}>
            Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
          </Text>
        )}
        {errorMsg && <Text style={styles.locationError}>{errorMsg}</Text>}
      </View>

      {/* Simulated alert banner */}
      {alert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerTitle}>{alert.title}</Text>
          <Text style={styles.alertBannerMessage}>{alert.message}</Text>
        </View>
      )}

      {/* Simulate alert buttons (the "developer menu") */}
      <Text style={styles.alertsSectionTitle}>Simulate an Emergency Alert</Text>
      <TouchableOpacity
        style={[styles.rectangularButton, styles.floodButton]}
        onPress={() => simulateAlert('flood')}
      >
        <Text style={styles.buttonText}>Trigger Flood Warning</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.rectangularButton, styles.hurricaneButton]}
        onPress={() => simulateAlert('hurricane')}
      >
        <Text style={styles.buttonText}>Trigger Hurricane Warning</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.rectangularButton, styles.heatwaveButton]}
        onPress={() => simulateAlert('heatwave')}
      >
        <Text style={styles.buttonText}>Trigger Heatwave Warning</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Safety Information pages' dropdown section component
function DropdownSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity 
        style={styles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.staticInfoTitle}>{title}</Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownContent}>
          {children}
        </View>
      )}
    </View>
  );
}

// Home screen
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Alerts button */}
      <TouchableOpacity 
        style={styles.circularButton}
        onPress={() => navigation.navigate('Alerts')}
      >
        <Text style={styles.circularButtonText}>Alerts</Text>
      </TouchableOpacity>

      {/* Emergency Essentials button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('EmergencyEssentials')}
      >
        <Text style={styles.buttonText}>Emergency Essentials</Text>
      </TouchableOpacity>

      {/* Test Your Knowledge button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('TestYourKnowledge')}
      >
        <Text style={styles.buttonText}>Test Your Knowledge</Text>
      </TouchableOpacity>

      {/* Safety Information button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('safetyInfo')}
      >
        <Text style={styles.buttonText}>Safety Information</Text>
      </TouchableOpacity>

      {/* Local Contacts section */}
      <Text style={styles.staticInfoTitle}>Local Contacts</Text>
      <View style={styles.staticInfoContainer}>
        <Text style={styles.staticInfoText}>
          Police:                             <Text style={styles.staticInfoTextBold}>999</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Ambulance:                   <Text style={styles.staticInfoTextBold}>995</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Non-emergency Ambulance:                 <Text style={styles.staticInfoTextBold}>1777</Text>
        </Text>
      </View>

      <StatusBar style="auto" />

    </View>
  );
}

// Checklists page
function ChecklistScreen() {
  const [activeTab, setActiveTab] = useState('ReadyBag');
  const [checkedItems, setCheckedItems] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Ready Bag items
  const readyBagItems = [
    {
      id: 'rb1',
      name: 'Torchlight without batteries',
      description: 'In case of power outage and when evacuating in the dark.'
    },
    {
      id: 'rb2',
      name: 'Batteries',
      description: 'For powering the torchlight; pack extra batteries and do not fit batteries into the devices until needed, as leaving them there may result in leakage or rust.'
    },
    {
      id: 'rb3',
      name: 'Essential personal medication',
      description: 'For any existing medical condition of yours and your family, e.g. asthma, heart problems etc.'
    },
    {
      id: 'rb4',
      name: 'Waterproof folder containing photocopies of important documents',
      description: 'For administrative purposes should the original documents be destroyed in the fire/emergency e.g. NRIC, insurance policies.'
    },
    {
      id: 'rb5',
      name: 'Whistle',
      description: 'To call for help or alert others; shouting may be tiring, ineffective and may even cause you to inhale dangerous amounts of smoke and dust in some cases.'
    },
    {
      id: 'rb6',
      name: 'First-aid kit',
      description: 'To treat any minor injuries.'
    },
    {
      id: 'rb7',
      name: 'Childcare supplies and other special care items',
      description: 'To meet the needs of any special individuals groups in the family, e.g. infants.'
    },
    {
      id: 'rb8',
      name: 'N95 Mask',
      description: 'To protect you and your family from excessive exposure to pollutants and air-borne infections.'
    }
  ];

  // First-Aid Kit items
  const firstAidItems = [
    {
      id: 'fa1',
      name: 'Adhesive tape',
      description: 'To hold dressings in place.'
    },
    {
      id: 'fa2',
      name: 'Adhesive / elastic bandages in various sizes',
      description: 'To cover, dress and protect cuts & wounds.'
    },
    {
      id: 'fa3',
      name: 'Alcohol swabs',
      description: 'To clean and disinfect the skin.'
    },
    {
      id: 'fa4',
      name: 'Antiseptic cream or solution',
      description: 'To clean and prevent infection of cuts and wounds.'
    },
    {
      id: 'fa5',
      name: 'Burn ointment',
      description: 'To prevent infection of burns.'
    },
    {
      id: 'fa6',
      name: 'Cotton balls',
      description: 'To apply medication or wash and clean wounds.'
    },
    {
      id: 'fa7',
      name: 'Eye wash solution',
      description: 'To irrigate and wash the eye.'
    },
    {
      id: 'fa8',
      name: 'Plasters',
      description: 'To cover cuts and wounds.'
    },
    {
      id: 'fa9',
      name: 'Scissors & tweezers',
      description: 'To cut gauze and bandages and remove foreign objects from the skin.'
    },
    {
      id: 'fa10',
      name: '20ml sodium chloride',
      description: 'To clean wounds.'
    },
    {
      id: 'fa11',
      name: 'Two pairs of disposable latex gloves',
      description: 'To prevent contamination of wounds and prevent infection.'
    },
    {
      id: 'fa12',
      name: 'Six safety pins',
      description: 'To hold bandages together.'
    },
    {
      id: 'fa13',
      name: 'Triangle bandage',
      description: 'To support an injured arm.'
    },
    {
      id: 'fa14',
      name: 'Sterile dressings/gauze',
      description: 'To dress and clean wounds.'
    }
  ];

  const currentItems = activeTab === 'ReadyBag' ? readyBagItems : firstAidItems;

  const toggleCheck = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const showDescription = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.checklistContainer}>
      {/* Checklists page's sub-tab buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'ReadyBag' && styles.activeTab]}
          onPress={() => setActiveTab('ReadyBag')}
        >
          <Text style={[styles.tabText, activeTab === 'ReadyBag' && styles.activeTabText]}>
            Ready Bag
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'FirstAid' && styles.activeTab]}
          onPress={() => setActiveTab('FirstAid')}
        >
          <Text style={[styles.tabText, activeTab === 'FirstAid' && styles.activeTabText]}>
            First-Aid Kit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Checklist items */}
      <ScrollView style={styles.checklistScroll}>
        {currentItems.map((item) => (
          <View key={item.id} style={styles.checklistItem}>
            {/* Information button on left */}
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => showDescription(item)}
            >
              <Text style={styles.infoButtonText}>?</Text>
            </TouchableOpacity>

            {/* Item name */}
            <Text style={styles.itemText}>{item.name}</Text>

            {/* Checkbox on right */}
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => toggleCheck(item.id)}
            >
              <View style={[
                styles.checkboxCircle,
                checkedItems[item.id] && styles.checkboxChecked
              ]} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal for item description */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <Text style={styles.modalDescription}>{selectedItem?.description}</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Quizzes page
function QuizzesScreen() {
  // Quiz questions data
  const quizQuestions = [
    {
      id: 'q1',
      question: 'Which of the following items is not included in a Ready Bag?',
      options: [
        { id: 'q1o1', text: 'Batteries' },
        { id: 'q1o2', text: 'Whistle' },
        { id: 'q1o3', text: 'Expensive figurines' },
        { id: 'q1o4', text: 'Childcare supplies and other special care items' }
      ],
      correctOptionId: 'q1o3'
    },
    {
      id: 'q2',
      question: 'Which of the following items is not included in a First-Aid Kit?',
      options: [
        { id: 'q2o1', text: 'Cotton balls' },
        { id: 'q2o2', text: 'Eye wash solution' },
        { id: 'q2o3', text: 'Safety pins' },
        { id: 'q2o4', text: 'Sewing Kit' }
      ],
      correctOptionId: 'q2o4'
    }
  ];

  // Track which option is selected for each question
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const handleAnswer = (questionId, optionId, correctOptionId) => {
    // Only allow selecting once per question
    if (selectedAnswers[questionId]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedId: optionId,
        isCorrect: optionId === correctOptionId
      }
    }));
  };

  return (
    <ScrollView 
      style={styles.quizContainer}
      contentContainerStyle={styles.quizContent}
    >
      {quizQuestions.map((question) => {
        const answer = selectedAnswers[question.id];

        return (
          <View key={question.id} style={styles.quizQuestionWrapper}>
            <Text style={styles.quizQuestionText}>{question.question}</Text>

            {question.options.map((option) => {
              let buttonStyle = styles.quizOptionButton;

              // If this question has been answered
              if (answer) {
                if (option.id === question.correctOptionId) {
                  // Always highlight correct answer green once answered
                  buttonStyle = [styles.quizOptionButton, styles.quizOptionCorrect];
                } else if (option.id === answer.selectedId) {
                  // Highlight the wrong selection red
                  buttonStyle = [styles.quizOptionButton, styles.quizOptionWrong];
                }
              }

              return (
                <TouchableOpacity
                  key={option.id}
                  style={buttonStyle}
                  onPress={() => handleAnswer(question.id, option.id, question.correctOptionId)}
                  disabled={!!answer}
                >
                  <Text style={styles.quizOptionText}>{option.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

// Information page
function InformationScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Floods button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('Floods')}
      >
        <Text style={styles.buttonText}>Floods</Text>
      </TouchableOpacity>

      {/* Hurricane button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('Hurricane')}
      >
        <Text style={styles.buttonText}>Hurricane</Text>
      </TouchableOpacity>

      {/* Heatwave button */}
      <TouchableOpacity 
        style={styles.rectangularButton}
        onPress={() => navigation.navigate('Heatwave')}
      >
        <Text style={styles.buttonText}>Heatwave</Text>
      </TouchableOpacity>

    </View>
  );
}

// Floods page
function FloodsPage() {
  return (
    <ScrollView style={styles.safetyInfoContainer}>
      <DropdownSection title="Preparing for a flood">
        <Text style={styles.staticInfoText}>
          1.
          <Text style={styles.staticInfoTextBold}> Follow the news:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Remain alert and monitor the situation through local news, radio and mobile messages for the latest news and updates on the weather and flood warnings.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2.
          <Text style={styles.staticInfoTextBold}> Know evacuation routes:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Be informed on the location of designated shelters and safe zones on higher grounds that are nearby.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3.
          <Text style={styles.staticInfoTextBold}> Emergency contacts:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Update contacts of family, friends and local emergency services. Ensure mobile phones and other communication devices are fully charged to stay connected during emergencies.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4.
          <Text style={styles.staticInfoTextBold}> Prepare an emergency bag:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Pack essential items and be prepared to leave as soon as evacuation orders are given.
        </Text>
      </DropdownSection>

      <DropdownSection title="What to do during a flood">
        <Text style={styles.staticInfoText}>
          1.
          <Text style={styles.staticInfoTextBold}> Listen to local authorities:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Stay informed through local news or radio for weather updates and evacuation advice. If evacuation orders are given, leave immediately and take your emergency kit and ID papers.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2.
          <Text style={styles.staticInfoTextBold}> Secure your home:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          If it's safe, unplug appliances and turn off electricity, gas, and water before evacuating.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3.
          <Text style={styles.staticInfoTextBold}> Move to higher ground:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Avoid standing or moving water. Never try to walk, swim, or drive through floodwaters. If trapped in a vehicle or building, move to the highest level.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4.
          <Text style={styles.staticInfoTextBold}> Protect children:</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          Keep children far away from floodwaters, as these can carry debris and contaminants.
        </Text>
      </DropdownSection>
    </ScrollView>
  );
}

// Hurricane page
function HurricanePage() {
  return (
    <ScrollView style={styles.safetyInfoContainer}>
      <DropdownSection title="Preparing for a hurricane">
        <Text style={styles.staticInfoText}>
          1.
          <Text style={styles.staticInfoTextBold}> Be informed </Text>
          by receiving alerts, warnings, and public safety information before, during, and after emergencies.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2.
          <Text style={styles.staticInfoTextBold}> Know your zone. </Text>
          Learn if you live in a hurricane evacuation zone
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3. Find out whether your property is in a flood-prone or high-risk area.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4. Create and review your
          <Text style={styles.staticInfoTextBold}> family emergency plan</Text>
          .
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          5. Assemble a
          <Text style={styles.staticInfoTextBold}> Ready Bag</Text>
          .
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          6. Follow instructions from public safety officials.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          7. Prepare for possible
          <Text style={styles.staticInfoTextBold}> power outages</Text>
          .
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          8.
          <Text style={styles.staticInfoTextBold}> Prepare your home</Text>
          .
        </Text>
      </DropdownSection>

      <DropdownSection title="What to do during a hurricane">
        <Text style={styles.staticInfoText}>
          1. Avoid driving or going outdoors during a storm. Flooding and damaging winds can make traveling dangerous.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2. Continue to monitor media for emergency information.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3. Follow instructions from public safety officials.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4. If advised to
          <Text style={styles.staticInfoTextBold}> evacuate</Text>
          , do so immediately. Take only essential items, and
          <Text style={styles.staticInfoTextBold}> bring your pets</Text>
          .
        </Text>
      </DropdownSection>
    </ScrollView>
  );
}

// Heatwave page
function HeatwavePage() {
  return (
    <ScrollView style={styles.safetyInfoContainer}>
      <DropdownSection title="Who is most at risk?">
        <Text style={styles.staticInfoText}>
          1.
          <Text style={styles.staticInfoTextBold}> Older people</Text>
          , especially those aged 65 and over.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2.
          <Text style={styles.staticInfoTextBold}> Babies and young children </Text>
          aged 5 years and under.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3. People who are
          <Text style={styles.staticInfoTextBold}> pregnant or have serious long-term conditions </Text>
          - such as heart problems, breathing problems, dementia, diabetes, kidney disease, Parkinson's disease, mobility problems, mental health problems, or drug or alcohol addiction.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4. People who
          <Text style={styles.staticInfoTextBold}> live alone </Text>
          and may be unable to care for themselves.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          5. People who are
          <Text style={styles.staticInfoTextBold}> on multiple medicines </Text>
          or medicines that may make them more likely to be badly affected by hot weather.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          6. People who are already
          <Text style={styles.staticInfoTextBold}> ill and dehydrated </Text>
          (e.g. from diarrhoea and vomiting).
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          7. People whose
          <Text style={styles.staticInfoTextBold}> jobs involve manual labour </Text>
          .
        </Text>
      </DropdownSection>

      <DropdownSection title="What to do in a heat wave">
        <Text style={styles.staticInfoText}>
          1.
          <Text style={styles.staticInfoTextBold}> Be prepared</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          - Know how hot and humid it is going to get today, this week and this month to help plan outside activities.
        </Text>
        <Text style={styles.staticInfoText}>
          - Keep an emergency kit at home that contains oral rehydration salt (ORS) packets, a thermometer, water bottles, towels or cloths to wet for cooling, a handheld fan or mister with batteries, and a checklist to identify and treat symptoms of heat stress.
        </Text>
        <Text style={styles.staticInfoText}>
          - Know how to get help. Note down the contact information for the nearest health care provider or ambulance/transport services.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          2.
          <Text style={styles.staticInfoTextBold}> Keep your home cool</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          - When possible, close the curtains during the hottest parts of the day and open windows at night time to cool down the house.
        </Text>
        <Text style={styles.staticInfoText}>
          - Use fans and coolers if available.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          3.
          <Text style={styles.staticInfoTextBold}> Stay out of the heat</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          - Do not go outside during the hottest times of the day if you can avoid it. Try to arrange your activities earlier or later in the day when it is cooler.
        </Text>
        <Text style={styles.staticInfoText}>
          - When outside, wear sunscreen and try to stay in the shade or use hats and umbrellas for protection.
        </Text>
        <Text></Text>
        <Text style={styles.staticInfoText}>
          4.
          <Text style={styles.staticInfoTextBold}> Stay cool and hydrated</Text>
        </Text>
        <Text style={styles.staticInfoText}>
          - Drink water at regular intervals before you are thirsty.
        </Text>
        <Text style={styles.staticInfoText}>
          - Overdressing in the heat can make you dehydrated and hotter faster, so wear light and loose clothes. Cotton is ideal during hot days to help reduce heat rashes and absorb sweating. Similarly, cotton bed sheets are recommended over non-breathable materials.
        </Text>
        <Text style={styles.staticInfoText}>
          - Carry a water bottle and a small towel, so you can hydrate and cool down by placing a wet towel on your neck.
        </Text>
        <Text style={styles.staticInfoText}>
          - Check to see if your community has a heat relief or cooling centre near you. You could also use the waiting areas of health facilities as a temporary cooling shelter.
        </Text>
      </DropdownSection>
    </ScrollView>
  );
}

// App component
export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Secure App' }}
      />
      <Stack.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{ title: 'Emergency Alerts' }}
      />
      <Stack.Screen 
        name="EmergencyEssentials" 
        component={ChecklistScreen} 
        options={{ title: 'Emergency Essentials' }}
      />
      <Stack.Screen 
        name="TestYourKnowledge" 
        component={QuizzesScreen} 
        options={{ title: 'Test Your Knowledge' }}
      />
      <Stack.Screen 
        name="safetyInfo" 
        component={InformationScreen} 
        options={{ title: 'Safety Information' }}
      />
      <Stack.Screen 
        name="Floods" 
        component={FloodsPage} 
        options={{ title: 'Floods' }}
      />
      <Stack.Screen 
        name="Hurricane" 
        component={HurricanePage} 
        options={{ title: 'Hurricane' }}
      />
      <Stack.Screen 
        name="Heatwave" 
        component={HeatwavePage} 
        options={{ title: 'Heatwave' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00258a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  // Rectangular buttons
  rectangularButton: {
    width: '80%',
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002ba3',
  },
  // Circular Alerts button
  circularButton: {
    width: 120,
    height: 120,
    borderRadius: 60, // Half of width/height makes it a circle
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circularButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002ba3',
  },
  // Alerts screen styles
  alertsContainer: {
    flex: 1,
    backgroundColor: '#00258a',
  },
  alertsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  alertsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
    marginBottom: 12,
  },
  locationBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  locationCity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00258a',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
  },
  locationError: {
    fontSize: 14,
    color: '#e74c3c',
  },
  // Simulated alert banner
  alertBanner: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  alertBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  alertBannerMessage: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 20,
  },
  // Coloured trigger buttons
  floodButton: {
    backgroundColor: '#71cb97',
  },
  hurricaneButton: {
    backgroundColor: '#dd877d',
  },
  heatwaveButton: {
    backgroundColor: '#f0c674',
  },
  // Static information text styles
  staticInfoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  staticInfoContainer: {
    width: '80%',
    alignItems: 'flex-start',
  },
  staticInfoText: {
    fontSize: 25,
    color: '#ffffff',
    marginBottom: 6,
  },
  staticInfoTextBold: {
    fontWeight: 'bold',
  },
  // Checklist screen styles
  checklistContainer: {
    flex: 1,
    backgroundColor: '#002ba3',
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#001f7a',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ffffff',
  },
  tabText: {
    color: '#8899cc',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  checklistScroll: {
    flex: 1,
    padding: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#002ba3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#00258a',
  },
  checkbox: {
    padding: 5,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#002ba3',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#002ba3',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00258a',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: '#002ba3',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Quizzes screen styles
  quizContainer: {
    flex: 1,
    backgroundColor: '#00258a',
  },
  quizContent: {
    padding: 20,
    paddingBottom: 40,
  },
  quizQuestionWrapper: {
    marginBottom: 30,
  },
  quizQuestionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  quizOptionButton: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  quizOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002ba3',
    textAlign: 'center',
  },
  quizOptionCorrect: {
    backgroundColor: '#71cb97',
  },
  quizOptionWrong: {
    backgroundColor: '#dd877d',
  },
  // Safety Information screen styles
  safetyInfoContainer: {
    flex: 1,
    backgroundColor: '#00258a',
    paddingHorizontal: 20
  },
  // Safety Information pages' dropdown styles
  dropdownWrapper: {
    paddingBottom: 20,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  dropdownArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dropdownContent: {
    paddingTop: 5,
  },
});
