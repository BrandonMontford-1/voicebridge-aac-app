import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ScrollView, Alert, Dimensions, Animated, SafeAreaView, StatusBar 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";

const { width } = Dimensions.get('window');

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [mode, setMode] = useState("Morning");
  const [audioOn, setAudioOn] = useState(true);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showFeelings, setShowFeelings] = useState(false);
  const [sentence, setSentence] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [pressAnim] = useState(new Animated.Value(1));

  // Data with favorites marked with stars
  const modeMap = {
    Morning: [["🆘","Help"],["🍳","Breakfast"],["🚗","Transport"],["👨‍👩‍👧‍👦","Call"]],
    Day: [["🆘","Help"],["🌤️","Weather"],["🥪","Lunch"],["🚻","Bathroom"]],
    Night: [["🆘","Help"],["🛁","Bath"],["🍎","Snack"],["🍽️","Dinner"]]
  };

  // Categories with favorite indicators - first item in each array is the favorite
  const categoryOptions = {
    Breakfast: [
      ["🥣","Cereal", true],  // Star - favorite
      ["🍳","Eggs", false],
      ["🍞","Toast", false],
      ["🥞","Pancakes", false]
    ],
    Transport: [
      ["🚌","Bus", true],     // Star - favorite
      ["🚗","Car", false],
      ["🚕","Taxi", false],
      ["🚶","Walk", false]
    ],
    "Call": [
      ["👩","Mom", true],     // Star - favorite
      ["👨","Dad", false],
      ["👵","Grandma", false],
      ["👴","Grandpa", false]
    ],
    Weather: [
      ["☀️","Sunny", true],   // Star - favorite
      ["🔥","Hot", false],
      ["❄️","Cold", false],
      ["🌧️","Rain", false]
    ],
    Lunch: [
      ["🥪","Sandwich", true], // Star - favorite
      ["🍕","Pizza", false],
      ["🥗","Salad", false],
      ["🍜","Soup", false]
    ],
    Snack: [
      ["🍎","Fruit", true],   // Star - favorite
      ["🍪","Cookie", false],
      ["🍿","Chips", false],
      ["🍦","Ice Cream", false]
    ],
    Dinner: [
      ["🍗","Chicken", true],  // Star - favorite
      ["🍝","Pasta", false],
      ["🐟","Fish", false],
      ["🥩","Steak", false]
    ]
  };

  const specialVerbs = {
    "Transport": "take the",
    "Call": "call",
    "Weather": "It's",
    "Bathroom": "use the",
    "Bath": "take a",
    "Help": "need"
  };

  // Get all favorite options across categories
  const getAllFavoriteOptions = () => {
    const favoritesList = [];
    
    // Add static phrases
    const staticPhrases = [
      { text: "Hello", emoji: "👋", phrase: "Hello" },
      { text: "Thank you", emoji: "🙏", phrase: "Thank you" },
      { text: "I like this", emoji: "👍", phrase: "I like this" },
      { text: "I don't like this", emoji: "👎", phrase: "I don't like this" },
      { text: "Let's go", emoji: "🚀", phrase: "Let's go" }
    ];
    
    // Add category favorites
    Object.keys(categoryOptions).forEach(category => {
      const options = categoryOptions[category];
      options.forEach(([emoji, text, isDefaultFavorite], index) => {
        const isFavorite = favorites[`${category}_${index}`] || (isDefaultFavorite && !favorites[`${category}_${index}`] === undefined);
        if (isFavorite) {
          // Create appropriate phrase for each favorite
          let phrase = "";
          if (specialVerbs[category]) {
            if (specialVerbs[category] === "It's") {
              phrase = `${specialVerbs[category]} ${text.toLowerCase()}`;
            } else if (specialVerbs[category] === "call") {
              phrase = `I want to ${specialVerbs[category]} ${text}`;
            } else {
              phrase = `I want to ${specialVerbs[category]} ${text.toLowerCase()}`;
            }
          } else {
            phrase = `I want ${text.toLowerCase()}`;
          }
          
          // Special cases
          if (text === "Walk") phrase = "I want to walk";
          if (text === "Bath") phrase = "I want to take a bath";
          if (text === "Help") phrase = "I need help";
          if (text === "Bathroom") phrase = "I need to use the bathroom";
          
          favoritesList.push({ 
            text, 
            emoji, 
            phrase,
            category,
            isCategoryFavorite: true 
          });
        }
      });
    });
    
    // Combine static phrases with category favorites
    return [...staticPhrases, ...favoritesList];
  };

  const favoriteOptions = getAllFavoriteOptions();
  
  const feelings = [
    ["😊", "Happy", "I feel happy"],
    ["😢", "Sad", "I feel sad"],
    ["😠", "Angry", "I feel angry"],
    ["😨", "Scared", "I feel scared"],
    ["😴", "Tired", "I feel tired"],
    ["🤒", "Sick", "I feel sick"],
    ["😋", "Hungry", "I feel hungry"],
    ["🥤", "Thirsty", "I feel thirsty"],
    ["😌", "Calm", "I feel calm"],
    ["😖", "Frustrated", "I feel frustrated"],
    ["😍", "Excited", "I feel excited"],
    ["😔", "Lonely", "I feel lonely"]
  ];

  // Effects
  useEffect(() => {
    AsyncStorage.getItem('userName').then(name => name && setUserName(name));
    // Load favorites from storage
    AsyncStorage.getItem('favorites').then(savedFavorites => {
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    });
  }, []);

  // Animation for button press
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Save favorites to storage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // Toggle favorite status
  const toggleFavorite = (category, optionIndex) => {
    const key = `${category}_${optionIndex}`;
    const newFavorites = {...favorites};
    
    // Toggle the favorite
    if (newFavorites[key]) {
      delete newFavorites[key];
    } else {
      // Clear any existing favorites for this category
      Object.keys(newFavorites).forEach(k => {
        if (k.startsWith(category + '_')) {
          delete newFavorites[k];
        }
      });
      newFavorites[key] = true;
    }
    
    saveFavorites(newFavorites);
  };

  // Check if an option is a favorite
  const isFavorite = (category, optionIndex) => {
    return favorites[`${category}_${optionIndex}`] || optionIndex === 0; // First item is default favorite
  };

  // Functions
  const speak = (text) => {
    if (!audioOn) return;
    Speech.stop();
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
    });
  };

  const getGradient = () => ({
    Morning: ["#4158D0", "#C850C0", "#FFCC70"],
    Day: ["#0093E9", "#80D0C7", "#8EC5FC"],
    Night: ["#0F2027", "#203A43", "#2C5364"]
  })[mode] || ["#667eea", "#764ba2"];

  const handleCategoryTap = (emoji, phrase) => {
    animatePress();
    if (categoryOptions[phrase]) {
      setShowOptions(phrase);
      setSelectedEmoji([emoji, phrase]);
      setSentence([phrase]);
    } else {
      setSelectedEmoji([emoji, phrase]);
      setShowOptions(null);
      setSentence([phrase]);
    }
  };

  const handleOptionSelect = (emoji, text, category, index) => {
    animatePress();
    setSelectedEmoji([emoji, text, category]);
    setShowOptions(null);
    setSentence([text]);
  };

  const handleChoice = (choice, item, category = item) => {
    animatePress();
    let message = "";
    
    if (specialVerbs[category]) {
      if (specialVerbs[category] === "It's") {
        message = `${specialVerbs[category]} ${item.toLowerCase()}`;
      } else if (specialVerbs[category] === "call") {
        message = `I ${choice === "want" ? "want to" : "don't want to"} ${specialVerbs[category]} ${item}`;
      } else {
        message = `I ${choice === "want" ? "want to" : "don't want to"} ${specialVerbs[category]} ${item.toLowerCase()}`;
      }
    } else {
      message = `I ${choice === "want" ? "want" : "don't want"} ${item.toLowerCase()}`;
    }

    // Special cases
    if (item === "Walk") message = choice === "want" ? "I want to walk" : "I don't want to walk";
    if (item === "Bath") message = choice === "want" ? "I want to take a bath" : "I don't want to take a bath";
    if (item === "Help") message = choice === "want" ? "I need help" : "I don't need help";
    if (item === "Bathroom") message = choice === "want" ? "I need to use the bathroom" : "I don't need to use the bathroom";
    
    speak(message);
    Alert.alert("Speaking", message);
    setSelectedEmoji(null);
    setShowOptions(null);
    setSentence([]);
  };

  const handleFeelingSelect = (feeling) => {
    animatePress();
    const [_, __, phrase] = feeling;
    setSentence([phrase]);
    speak(phrase);
    Alert.alert("Feeling", phrase);
    setShowFeelings(false);
  };

  const handlePhrase = (phrase, isCategoryFavorite = false, category = null) => {
    animatePress();
    let message = phrase;
    
    // Handle special greeting
    if (phrase === "Hello" && userName) {
      message = `Hello, I'm ${userName}`;
    }
    
    // If it's a category favorite that needs a full sentence
    if (isCategoryFavorite && category) {
      // Reconstruct the full sentence
      const text = phrase.split(" ").pop(); // Get the last word
      if (specialVerbs[category]) {
        if (specialVerbs[category] === "It's") {
          message = `${specialVerbs[category]} ${text.toLowerCase()}`;
        } else if (specialVerbs[category] === "call") {
          message = `I want to ${specialVerbs[category]} ${text}`;
        } else {
          message = `I want to ${specialVerbs[category]} ${text.toLowerCase()}`;
        }
      } else {
        message = `I want ${text.toLowerCase()}`;
      }
      
      // Special cases
      if (text === "Walk") message = "I want to walk";
      if (text === "Bath") message = "I want to take a bath";
      if (text === "Help") message = "I need help";
      if (text === "Bathroom") message = "I need to use the bathroom";
    }
    
    setSentence([message]);
    speak(message);
  };

  const handleStart = async () => {
    animatePress();
    if (userName.trim()) {
      await AsyncStorage.setItem('userName', userName.trim());
      setScreen("main");
    }
  };

  const handleCallButton = () => {
    animatePress();
    if (showOptions === "Call") {
      setShowOptions(null);
      setSelectedEmoji(null);
      setSentence([]);
    } else {
      setShowOptions("Call");
      setSelectedEmoji(["👨‍👩‍👧‍👦", "Call"]);
      setSentence(["Call"]);
    }
  };

  // Premium Button Component
  const PremiumButton = ({ children, style, onPress, gradient = ["#667eea", "#764ba2"], icon = null }) => (
    <Animated.View style={{ transform: [{ scale: pressAnim }], width: '100%' }}>
      <TouchableOpacity 
        style={[styles.premiumButton, style]} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient}
          style={styles.premiumButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Sentence Display Component
  const SentenceDisplay = () => (
    <View style={styles.sentenceContainer}>
      <LinearGradient
        colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]}
        style={styles.sentenceGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.sentenceLabel}>YOUR MESSAGE</Text>
        <Text style={styles.sentenceText}>
          {sentence.length > 0 ? sentence.join(" ") : "Tap buttons to build your message..."}
        </Text>
        {sentence.length > 0 && (
          <View style={styles.sentenceIndicator}>
            <Text style={styles.sentenceIndicatorText}>🔊 Ready to speak</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  // Welcome Screen
  if (screen === "welcome") {
    return (
      <LinearGradient colors={["#4158D0", "#C850C0", "#FFCC70"]} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconContainer}>
                <LinearGradient
                  colors={["#FFB75E", "#ED8F03"]}
                  style={styles.welcomeIconGradient}
                >
                  <Text style={styles.welcomeIcon}>🗣️</Text>
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>VoiceBridge</Text>
              <Text style={styles.welcomeSubtitle}>Your voice, amplified</Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>What's your name?</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput 
                    value={userName} 
                    onChangeText={setUserName} 
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.nameInput} 
                  />
                </View>
              </View>
              
              <PremiumButton
                gradient={userName.trim() ? ["#FFB75E", "#ED8F03"] : ["#95a5a6", "#7f8c8d"]}
                onPress={handleStart}
                icon="✨"
              >
                <Text style={styles.premiumButtonText}>Get Started</Text>
              </PremiumButton>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Phrases Screen
  if (screen === "phrases") {
    return (
      <LinearGradient colors={["#4158D0", "#C850C0"]} style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.phrasesContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.phrasesHeader}>
              <Text style={styles.phrasesTitle}>⭐ Favorites</Text>
              <Text style={styles.phrasesSubtitle}>Quick access to your starred phrases</Text>
            </View>
            
            <SentenceDisplay />
            
            {/* Basic Phrases */}
            {favoriteOptions.filter(f => !f.isCategoryFavorite).length > 0 && (
              <View style={styles.phrasesSection}>
                <Text style={styles.phrasesSectionTitle}>BASIC PHRASES</Text>
                {favoriteOptions
                  .filter(f => !f.isCategoryFavorite)
                  .map((item, i) => (
                    <PremiumButton
                      key={`basic-${i}`}
                      gradient={["#36D1DC", "#5B86E5"]}
                      onPress={() => handlePhrase(item.phrase)}
                      icon={item.emoji}
                      style={styles.phraseButton}
                    >
                      <Text style={styles.phraseButtonText}>{item.text}</Text>
                    </PremiumButton>
                  ))
                }
              </View>
            )}
            
            {/* Category Favorites */}
            {favoriteOptions.filter(f => f.isCategoryFavorite).length > 0 && (
              <View style={styles.phrasesSection}>
                <Text style={styles.phrasesSectionTitle}>⭐ CATEGORY FAVORITES</Text>
                {favoriteOptions
                  .filter(f => f.isCategoryFavorite)
                  .map((item, i) => (
                    <PremiumButton
                      key={`fav-${i}`}
                      gradient={["#FFB75E", "#ED8F03"]}
                      onPress={() => handlePhrase(item.phrase, true, item.category)}
                      icon={item.emoji}
                      style={styles.favoritePhraseButton}
                    >
                      <View style={styles.favoritePhraseContent}>
                        <Text style={styles.favoritePhraseText}>{item.text}</Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View>
                      </View>
                    </PremiumButton>
                  ))
                }
              </View>
            )}
            
            <PremiumButton
              gradient={["#4158D0", "#C850C0"]}
              onPress={() => { setScreen("main"); setSentence([]); }}
              icon="←"
              style={styles.backButton}
            >
              <Text style={styles.premiumButtonText}>Back to Main</Text>
            </PremiumButton>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Main Screen
  return (
    <LinearGradient colors={getGradient()} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.mainHeader}>
            <View style={styles.userInfoRow}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={styles.userAvatar}
              >
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
              <View style={styles.userDetails}>
                <Text style={styles.userGreeting}>Hello, {userName}!</Text>
                <View style={styles.modePill}>
                  <Text style={styles.modePillText}>{mode} Mode</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            {["Morning", "Day", "Night"].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, mode === m && styles.modeTabActive]}
                onPress={() => { 
                  setMode(m); 
                  setSelectedEmoji(null); 
                  setShowOptions(null); 
                  setSentence([]);
                }}
              >
                <LinearGradient
                  colors={mode === m ? 
                    ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"] : 
                    ["transparent", "transparent"]}
                  style={styles.modeTabGradient}
                >
                  <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                    {m}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Grid */}
          <View style={styles.mainGrid}>
            <Text style={styles.gridTitle}>WHAT WOULD YOU LIKE?</Text>
            <View style={styles.gridContainer}>
              {modeMap[mode].map(([emoji, phrase], i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.gridItem, selectedEmoji?.[0] === emoji && styles.gridItemSelected]}
                  onPress={() => handleCategoryTap(emoji, phrase)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedEmoji?.[0] === emoji ? 
                      ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"] : 
                      ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]}
                    style={styles.gridItemGradient}
                  >
                    <Text style={styles.gridItemEmoji}>{emoji}</Text>
                    <Text style={styles.gridItemText}>{phrase}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options Panel */}
          {showOptions && (
            <View style={styles.optionsPanel}>
              <Text style={styles.optionsTitle}>CHOOSE AN OPTION</Text>
              <Text style={styles.optionsSubtitle}>Long press ⭐ to set as favorite</Text>
              <View style={styles.optionsGrid}>
                {categoryOptions[showOptions].map(([emoji, text, isDefaultFavorite], i) => {
                  const favorite = isFavorite(showOptions, i);
                  return (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.optionItem} 
                      onPress={() => handleOptionSelect(emoji, text, showOptions, i)}
                      onLongPress={() => toggleFavorite(showOptions, i)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={favorite ? 
                          ["rgba(255,215,0,0.3)", "rgba(255,215,0,0.1)"] : 
                          ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]}
                        style={styles.optionItemGradient}
                      >
                        {favorite && (
                          <View style={styles.optionFavoriteBadge}>
                            <Text style={styles.optionFavoriteText}>⭐</Text>
                          </View>
                        )}
                        <Text style={styles.optionEmoji}>{emoji}</Text>
                        <Text style={styles.optionText}>{text}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Choice Buttons */}
          {selectedEmoji && !showOptions && (
            <View style={styles.choiceContainer}>
              <Text style={styles.choiceTitle}>HOW DO YOU FEEL?</Text>
              <View style={styles.choiceButtons}>
                <TouchableOpacity 
                  style={[styles.choiceButton, styles.wantButton]}
                  onPress={() => handleChoice("want", selectedEmoji[1], selectedEmoji[2] || selectedEmoji[1])}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#2ecc71", "#27ae60"]}
                    style={styles.choiceButtonGradient}
                  >
                    <Text style={styles.choiceButtonIcon}>✓</Text>
                    <Text style={styles.choiceButtonText}>I Want</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.choiceButton, styles.dontButton]}
                  onPress={() => handleChoice("dont", selectedEmoji[1], selectedEmoji[2] || selectedEmoji[1])}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#e74c3c", "#c0392b"]}
                    style={styles.choiceButtonGradient}
                  >
                    <Text style={styles.choiceButtonIcon}>✗</Text>
                    <Text style={styles.choiceButtonText}>Don't Want</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Feelings Panel */}
          {showFeelings && (
            <View style={styles.feelingsPanel}>
              <Text style={styles.feelingsTitle}>HOW ARE YOU FEELING?</Text>
              <View style={styles.feelingsGrid}>
                {feelings.map(([emoji, text, phrase], i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.feelingItem}
                    onPress={() => handleFeelingSelect([emoji, text, phrase])}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#8E2DE2", "#4A00E0"]}
                      style={styles.feelingItemGradient}
                    >
                      <Text style={styles.feelingEmoji}>{emoji}</Text>
                      <Text style={styles.feelingText}>{text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.closeFeelingsButton}
                onPress={() => setShowFeelings(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#95a5a6", "#7f8c8d"]}
                  style={styles.closeFeelingsGradient}
                >
                  <Text style={styles.closeFeelingsText}>Close</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Sentence Display */}
          <SentenceDisplay />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, showOptions === "Call" && styles.navItemActive]}
            onPress={handleCallButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={showOptions === "Call" ? ["#e74c3c", "#c0392b"] : ["#3498db", "#2980b9"]}
              style={styles.navItemGradient}
            >
              <Text style={styles.navItemIcon}>{showOptions === "Call" ? "←" : "📞"}</Text>
              <Text style={styles.navItemText}>{showOptions === "Call" ? "Back" : "Call"}</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => { setScreen("phrases"); setShowOptions(null); setSelectedEmoji(null); }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#9b59b6", "#8e44ad"]}
              style={styles.navItemGradient}
            >
              <Text style={styles.navItemIcon}>⭐</Text>
              <Text style={styles.navItemText}>Favorites</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, showFeelings && styles.navItemActive]}
            onPress={() => setShowFeelings(!showFeelings)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={showFeelings ? ["#FF416C", "#FF4B2B"] : ["#36D1DC", "#5B86E5"]}
              style={styles.navItemGradient}
            >
              <Text style={styles.navItemIcon}>😊</Text>
              <Text style={styles.navItemText}>Feelings</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, audioOn && styles.navItemAudioActive]}
            onPress={() => setAudioOn(!audioOn)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={audioOn ? ["#27ae60", "#219653"] : ["#95a5a6", "#7f8c8d"]}
              style={styles.navItemGradient}
            >
              <Text style={styles.navItemIcon}>{audioOn ? "🔊" : "🔇"}</Text>
              <Text style={styles.navItemText}>{audioOn ? "On" : "Off"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  mainContent: {
    paddingBottom: 100,
    paddingTop: 20,
  },
  phrasesContent: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  // Welcome Screen
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  welcomeIconContainer: {
    marginBottom: 20,
  },
  welcomeIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeIcon: {
    fontSize: 50,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nameInput: {
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },

  // Premium Button
  premiumButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  premiumButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Main Header
  mainHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  modeTab: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modeTabActive: {
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modeTabGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#fff',
  },

  // Main Grid
  mainGrid: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 60) / 2,
    height: 120,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gridItemSelected: {
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gridItemGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  gridItemEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  gridItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Options Panel
  optionsPanel: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  optionsSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionItem: {
    width: (width - 100) / 2,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionItemGradient: {
    padding: 15,
    alignItems: 'center',
    position: 'relative',
    minHeight: 90,
  },
  optionFavoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionFavoriteText: {
    fontSize: 14,
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  optionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Choice Buttons
  choiceContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  choiceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  choiceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  choiceButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  choiceButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonIcon: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  choiceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Feelings Panel
  feelingsPanel: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  feelingsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  feelingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feelingItem: {
    width: (width - 100) / 3,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  feelingItemGradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  feelingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  feelingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeFeelingsButton: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeFeelingsGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeFeelingsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Sentence Display
  sentenceContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  sentenceGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sentenceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sentenceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 26,
  },
  sentenceIndicator: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  sentenceIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  navItemActive: {
    borderColor: 'rgba(255,255,255,0.6)',
  },
  navItemAudioActive: {
    borderColor: '#27ae60',
  },
  navItemGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemIcon: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 2,
  },
  navItemText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Phrases Screen
  phrasesHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  phrasesTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  phrasesSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  phrasesSection: {
    width: '100%',
    marginBottom: 25,
  },
  phrasesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    letterSpacing: 1,
  },
  phraseButton: {
    marginBottom: 10,
  },
  phraseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  favoritePhraseButton: {
    marginBottom: 10,
  },
  favoritePhraseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  favoritePhraseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 10,
    borderRadius: 15,
  },
});