/* The in-photo motion demo (port of demoEffectMarkup + the keyframes in prototype/photo-frame/styles.css).
 * Purely visual: a 5-second loop over the SAME photo — it never advances to the next one. */
import { Image } from "expo-image";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, type EasingFunction } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { frame as palette } from "@/theme";
import { MOTION_SECONDS, imageSource, normalizedEffectType, normalizedWeatherPreset } from "./data";
import type { Motion, PhotoSource, WeatherPreset } from "./types";

const NATIVE = Platform.OS !== "web";
export type Size = { width: number; height: number };

/** A 0→1 value that loops every `duration` ms while `playing`; `phase` starts mid-cycle (CSS negative delay). */
function useLoop(playing: boolean, duration: number, easing: EasingFunction = Easing.linear, phase = 0, delay = 0, native = NATIVE) {
  const value = useRef(new Animated.Value(phase)).current;
  useEffect(() => {
    if (!playing) {
      value.stopAnimation();
      return;
    }
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      value.setValue(0);
      Animated.timing(value, { toValue: 1, duration, easing, useNativeDriver: native }).start(({ finished }) => finished && run());
    };
    value.setValue(phase);
    const first = Animated.sequence([Animated.delay(delay), Animated.timing(value, { toValue: 1, duration: duration * (1 - phase), easing, useNativeDriver: native })]);
    first.start(({ finished }) => finished && run());
    return () => {
      cancelled = true;
      value.stopAnimation();
    };
  }, [playing, duration, easing, phase, delay, native, value]);
  return value;
}

const subjectEasing = Easing.bezier(0.45, 0, 0.3, 1);
const inOut = Easing.inOut(Easing.ease);
const easeIn = Easing.in(Easing.ease);

/** Action extension: a slow Ken Burns pan / zoom of the subject layer over 5 s. */
export function SubjectMotion({ src, playing, size }: { src: PhotoSource; playing: boolean; size: Size }) {
  const v = useLoop(playing, MOTION_SECONDS * 1000, subjectEasing);
  const scale = v.interpolate({ inputRange: [0, 0.26, 0.58, 0.82, 1], outputRange: [1, 1.018, 1.034, 1.016, 1] });
  const translateX = v.interpolate({ inputRange: [0, 0.26, 0.58, 0.82, 1], outputRange: [0, size.width * 0.004, -size.width * 0.007, size.width * 0.006, 0] });
  const translateY = v.interpolate({ inputRange: [0, 0.26, 0.58, 0.82, 1], outputRange: [0, -size.height * 0.008, -size.height * 0.002, size.height * 0.006, 0] });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]}>
      <Image source={imageSource(src)} contentFit="contain" style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function SunlightBand({ playing, size, left, delay, opacity }: { playing: boolean; size: Size; left: number; delay: number; opacity: number }) {
  const v = useLoop(playing, MOTION_SECONDS * 1000, inOut, 0, delay);
  const bandWidth = size.width * 0.28;
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, bandWidth * 5.4] });
  const fade = v.interpolate({ inputRange: [0, 0.18, 0.78, 1], outputRange: [0, 0.75 * opacity, 0.58 * opacity, 0] });
  return (
    <Animated.View style={{ position: "absolute", top: -size.height * 0.2, left, width: bandWidth, height: size.height * 1.4, opacity: playing ? fade : 0.35 * opacity, transform: [{ translateX }, { skewX: "-14deg" }] }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="sunband" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#fff2be" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#fff2be" stopOpacity="0.62" />
            <Stop offset="1" stopColor="#fff2be" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sunband)" />
      </Svg>
    </Animated.View>
  );
}

function Cloud({ playing, size, top, scale, phase, opacity }: { playing: boolean; size: Size; top: number; scale: number; phase: number; opacity: number }) {
  const v = useLoop(playing, MOTION_SECONDS * 1000, Easing.linear, phase);
  const width = size.width * 0.18;
  const height = size.height * 0.11;
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, width * 7.6] });
  const puff = { position: "absolute" as const, bottom: height * 0.16, borderRadius: 999, backgroundColor: "rgba(244,249,249,0.72)" };
  return (
    <Animated.View style={{ position: "absolute", left: -width * 1.2, top: size.height * top, width, height, opacity, transform: [{ translateX }, { scale }] }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: "rgba(244,249,249,0.72)" }} />
      <View style={[puff, { left: width * 0.17, width: width * 0.42, height: width * 0.42 }]} />
      <View style={[puff, { right: width * 0.14, width: width * 0.32, height: width * 0.32 }]} />
    </Animated.View>
  );
}

function RainDrop({ playing, size, x, phase }: { playing: boolean; size: Size; x: number; phase: number }) {
  const v = useLoop(playing, 900, Easing.linear, phase);
  const length = size.height * 0.18;
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, length * 7.8] });
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  return <Animated.View style={{ position: "absolute", top: -size.height * 0.22, left: size.width * x, width: 1, height: length, backgroundColor: "rgba(224,243,246,0.76)", transform: [{ translateX }, { translateY }, { rotate: "10deg" }] }} />;
}

function Snowflake({ playing, size, x, phase, dot }: { playing: boolean; size: Size; x: number; phase: number; dot: number }) {
  const v = useLoop(playing, 2500, easeIn, phase);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, size.height * 1.15] });
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, 26] });
  const opacity = v.interpolate({ inputRange: [0, 0.14, 1], outputRange: [0, 0.9, 0.35] });
  return <Animated.View style={{ position: "absolute", top: -size.height * 0.09, left: size.width * x, width: dot, height: dot, borderRadius: dot, backgroundColor: "rgba(255,255,255,0.88)", opacity: playing ? opacity : 0.6, transform: [{ translateX }, { translateY }] }} />;
}

/** Deterministic particle layout (same arithmetic as the prototype's weatherParticles). */
function particles(kind: "rain" | "snow", count: number) {
  const cycle = kind === "snow" ? 2.5 : 0.9;
  return Array.from({ length: count }, (_, index) => {
    const x = ((index * 37 + 11) % 96) / 100;
    const delay = ((index * 19) % 23) / 10;
    const size = kind === "snow" ? 3 + (index % 4) : 1;
    return { x, phase: (delay % cycle) / cycle, size };
  });
}

const WEATHER_TINT: Record<WeatherPreset, string> = {
  sunlight: "rgba(255,214,124,0.10)",
  clouds: "rgba(107,129,134,0.09)",
  rain: "rgba(28,58,66,0.19)",
  snow: "rgba(218,238,243,0.10)",
};

export function WeatherOverlay({ preset, playing, size }: { preset: WeatherPreset; playing: boolean; size: Size }) {
  const reveal = useLoop(playing, MOTION_SECONDS * 1000, inOut);
  const opacity = reveal.interpolate({ inputRange: [0, 0.48, 0.72, 1], outputRange: [0.25, 0.86, 0.86, 0.25] });
  const rain = useMemo(() => particles("rain", 22), []);
  const snow = useMemo(() => particles("snow", 18), []);
  if (!size.width || !size.height) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: WEATHER_TINT[preset], opacity: playing ? opacity : 0.45 }]}>
      {preset === "sunlight" ? (
        <>
          <SunlightBand playing={playing} size={size} left={-size.width * 0.3} delay={0} opacity={1} />
          <SunlightBand playing={playing} size={size} left={-size.width * 0.52} delay={450} opacity={0.5} />
        </>
      ) : null}
      {preset === "clouds" ? (
        <>
          <Cloud playing={playing} size={size} top={0.13} scale={1} phase={0} opacity={1} />
          <Cloud playing={playing} size={size} top={0.29} scale={0.72} phase={0.48} opacity={0.65} />
          <Cloud playing={playing} size={size} top={0.06} scale={0.48} phase={0.74} opacity={0.5} />
        </>
      ) : null}
      {preset === "rain" ? rain.map((drop, index) => <RainDrop key={index} playing={playing} size={size} x={drop.x} phase={drop.phase} />) : null}
      {preset === "snow" ? snow.map((flake, index) => <Snowflake key={index} playing={playing} size={size} x={flake.x} phase={flake.phase} dot={flake.size} />) : null}
    </Animated.View>
  );
}

/** Renders the demo effect for a motion over the stage (subject layer or weather particles). */
export function DemoEffect({ src, motion, playing, size }: { src: PhotoSource; motion: Motion; playing: boolean; size: Size }) {
  if (normalizedEffectType(motion.effectType) === "action-extension") return <SubjectMotion src={src} playing={playing} size={size} />;
  return <WeatherOverlay preset={normalizedWeatherPreset(motion.weatherPreset)} playing={playing} size={size} />;
}

/** The 3 px coral playback bar along the bottom of the stage (5 s loop, paused when not playing). */
export function PlaybackProgress({ playing }: { playing: boolean }) {
  const v = useLoop(playing, MOTION_SECONDS * 1000, Easing.linear, 0, 0, false);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: "rgba(255,255,255,0.24)" }}>
      <Animated.View style={{ height: "100%", width, backgroundColor: palette.coral }} />
    </View>
  );
}

/** The scanning line over the photo while the AI run is processing. */
export function ScanLine({ height }: { height: number }) {
  const v = useLoop(true, 2200, inOut);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [height * 0.08, height * 0.91] });
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, backgroundColor: "rgba(255,255,255,0.9)", transform: [{ translateY }] }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 2, height: 26, backgroundColor: "rgba(18,107,85,0.28)" }} />
    </Animated.View>
  );
}
