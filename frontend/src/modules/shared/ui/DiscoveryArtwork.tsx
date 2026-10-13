import { type ReactNode, useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppearance } from '@/theme/ThemeProvider';

export type DiscoveryKind =
  | 'rooms'
  | 'rides'
  | 'jobs'
  | 'community'
  | 'events'
  | 'marketplace'
  | 'referrals'
  | 'expenses'
  | 'essentials'
  | 'connection';

/** Small, local vector scenes: decorative category art, never a photo of an actual listing. */
export function DiscoveryArtwork({ kind, height = 120 }: { kind: DiscoveryKind; height?: number }) {
  const { palette: p } = useAppearance();
  const id = `art${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const violet = `url(#${id}v)`,
    pearl = `url(#${id}p)`,
    green = `url(#${id}g)`,
    copper = `url(#${id}c)`;
  const gradient = (suffix: string, light: string, dark: string) => (
    <LinearGradient id={id + suffix} x1="0" x2="1" y1="0" y2="1">
      <Stop offset="0" stopColor={light} />
      <Stop offset="1" stopColor={dark} />
    </LinearGradient>
  );
  let scene: ReactNode;
  if (kind === 'connection' || kind === 'referrals')
    scene = (
      <G>
        <Ellipse cx="121" cy="135" rx="74" ry="10" fill={p.artShadow} />
        <G transform="rotate(-28 118 79)">
          <Path
            d="M38 86a80 43 0 1 0 160 0a80 43 0 1 0-160 0M62 86a56 26 0 1 1 112 0a56 26 0 1 1-112 0"
            fill={p.artPurpleShade}
            fillRule="evenodd"
          />
          <Path
            d="M38 77a80 43 0 1 0 160 0a80 43 0 1 0-160 0M62 77a56 26 0 1 1 112 0a56 26 0 1 1-112 0"
            fill={pearl}
            fillRule="evenodd"
          />
        </G>
        <G transform="rotate(38 123 89)">
          <Path
            d="M64 95a63 34 0 1 0 126 0a63 34 0 1 0-126 0M83 95a44 20 0 1 1 88 0a44 20 0 1 1-88 0"
            fill={p.artPurpleShade}
            fillRule="evenodd"
          />
          <Path
            d="M64 86a63 34 0 1 0 126 0a63 34 0 1 0-126 0M83 86a44 20 0 1 1 88 0a44 20 0 1 1-88 0"
            fill={violet}
            fillRule="evenodd"
          />
        </G>
        <Circle cx="54" cy="35" r="8" fill={pearl} />
        <Circle cx="197" cy="123" r="6" fill={copper} />
      </G>
    );
  else if (kind === 'rooms')
    scene = (
      <G>
        <Path d="M32 104 118 145 213 99 125 61Z" fill={p.artShadow} />
        <Path d="M42 91V43l70-27 82 38v48l-80 34Z" fill={pearl} />
        <Path d="M112 16v74l82 12V54Z" fill={p.artViolet} />
        <Path d="M42 91 112 62 194 102 114 136Z" fill={p.artPurpleShade} />
        <Path d="M67 76 113 57 177 87 130 110Z" fill={violet} />
        <Path d="M67 76v20l63 30v-16Z" fill={p.artPurpleShade} />
        <Path d="M130 110v16l47-23V87Z" fill={p.artPurple} />
        <Path d="M100 68 118 61 140 71 121 79Z" fill={p.artPaper} />
        <Path d="M81 76 99 69 120 79 102 86Z" fill={p.artPaper} />
        <Path d="M148 34v26l24 12V45Z" fill={p.artPaper} />
        <Path d="M160 40v27M148 47l24 12" stroke={p.artPurple} strokeWidth="2" />
      </G>
    );
  else if (kind === 'rides')
    scene = (
      <G>
        <Ellipse cx="122" cy="127" rx="88" ry="12" fill={p.artShadow} />
        <Path
          d="M22 106c30-25 48-8 71-22s60-25 114-17"
          fill="none"
          stroke={p.artGreen}
          strokeWidth="2"
          strokeDasharray="5 7"
        />
        <Path d="m55 83 23-36h75l26 36 24 9v25H39V96Z" fill={green} />
        <Path d="M87 54h24v28H70Zm33 0h27l22 28h-49Z" fill={p.artPaper} />
        <Path d="M40 94h163v21H40Z" fill={p.artGreenShade} />
        <Rect x="40" y="91" width="16" height="8" rx="3" fill={p.artPaper} />
        <Rect x="187" y="91" width="16" height="8" rx="3" fill={p.artCopper} />
        <Circle cx="76" cy="115" r="17" fill={p.artInk} />
        <Circle cx="76" cy="115" r="8" fill={p.artPaper} />
        <Circle cx="170" cy="115" r="17" fill={p.artInk} />
        <Circle cx="170" cy="115" r="8" fill={p.artPaper} />
      </G>
    );
  else if (kind === 'jobs')
    scene = (
      <G>
        <Ellipse cx="128" cy="133" rx="69" ry="12" fill={p.artShadow} />
        <G transform="rotate(-12 118 78)">
          <Rect x="72" y="25" width="86" height="102" rx="8" fill={pearl} />
          <Path
            d="M88 48h51M88 60h40M88 72h47"
            stroke={p.artPurple}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </G>
        <Path d="M79 79 153 64 188 85l-75 18Z" fill={p.artCopper} />
        <Path d="M79 79v44l34 20v-40Z" fill={p.artCopperShade} />
        <Path d="M113 103v40l75-19V85Z" fill={copper} />
        <Path
          d="M110 77V61l25-6 14 9v10"
          stroke={p.artCopperShade}
          strokeWidth="8"
          fill="none"
          strokeLinejoin="round"
        />
        <Path d="m142 95 17-4v12l-17 4Z" fill={p.artPaper} />
      </G>
    );
  else if (kind === 'community')
    scene = (
      <G>
        <Ellipse cx="119" cy="132" rx="82" ry="11" fill={p.artShadow} />
        <Path
          d="M54 94 119 52 187 91"
          stroke={p.artPurple}
          strokeWidth="3"
          fill="none"
          strokeDasharray="4 6"
        />
        <Circle cx="53" cy="74" r="22" fill={copper} />
        <Path d="M22 126c0-38 62-38 62 0Z" fill={copper} />
        <Circle cx="184" cy="73" r="23" fill={green} />
        <Path d="M151 126c0-39 66-39 66 0Z" fill={green} />
        <Circle cx="119" cy="55" r="27" fill={pearl} />
        <Path d="M78 125c0-52 82-52 82 0Z" fill={violet} />
        <Path
          d="M106 58c8 10 20 10 28 0"
          stroke={p.artPurpleShade}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  else if (kind === 'events')
    scene = (
      <G>
        <Ellipse cx="123" cy="130" rx="72" ry="12" fill={p.artShadow} />
        <G transform="rotate(-15 116 75)">
          <Rect x="44" y="40" width="140" height="80" rx="12" fill={copper} />
          <Path d="M141 47v65" stroke={p.artPaper} strokeWidth="2" strokeDasharray="4 5" />
        </G>
        <G transform="rotate(12 123 89)">
          <Rect x="58" y="57" width="141" height="77" rx="12" fill={pearl} />
          <Path d="M157 65v61" stroke={p.artPurple} strokeWidth="2" strokeDasharray="4 5" />
          <Path d="m105 74 6 12 13 2-10 10 2 14-11-7-12 7 3-14-10-10 13-2Z" fill={p.artPurple} />
          <Path d="M169 80h17M169 92h17M169 104h17" stroke={p.artCopperShade} strokeWidth="3" />
        </G>
      </G>
    );
  else if (kind === 'marketplace')
    scene = (
      <G>
        <Ellipse cx="120" cy="137" rx="63" ry="11" fill={p.artShadow} />
        <Path d="m65 65 63-19 43 22-8 71-62 12-37-25Z" fill={copper} />
        <Path d="m128 46-7 74-20 31-37-25 1-61Z" fill={p.artCopperShade} />
        <Path d="M84 62V43c0-31 43-34 43-7v12" stroke={p.artInk} strokeWidth="6" fill="none" />
        <Path d="M115 62V43c0-27 39-23 39 0v17" stroke={p.artPaper} strokeWidth="6" fill="none" />
        <Circle cx="143" cy="97" r="13" fill={p.artPaper} />
      </G>
    );
  else if (kind === 'essentials')
    scene = (
      <G>
        <Ellipse cx="117" cy="135" rx="69" ry="10" fill={p.artShadow} />
        <Path d="m46 72 71-31 77 34-73 36Z" fill={pearl} />
        <Path d="M46 72v49l75 27v-37Z" fill={p.artCopperShade} />
        <Path d="M121 111v37l73-31V75Z" fill={copper} />
        <Path d="m91 53 19-8 72 35-19 8Z" fill={p.artPurple} />
        <Path d="m153 91 19-8v25l-19 8Z" fill={p.artViolet} />
        <Path d="M168 20c-21 0-31 25-16 42l16 18 17-18c15-17 5-42-17-42Z" fill={green} />
        <Circle cx="168" cy="41" r="9" fill={p.artPaper} />
      </G>
    );
  else
    scene = (
      <G>
        <Ellipse cx="123" cy="134" rx="69" ry="11" fill={p.artShadow} />
        <G transform="rotate(-14 115 80)">
          <Rect x="54" y="39" width="127" height="89" rx="13" fill={green} />
          <Rect x="54" y="59" width="127" height="15" fill={p.artGreenShade} />
        </G>
        <G transform="rotate(10 128 91)">
          <Rect x="67" y="60" width="127" height="79" rx="13" fill={pearl} />
          <Rect x="82" y="82" width="25" height="21" rx="5" fill={p.artPurple} />
          <Path
            d="M82 119h33M153 88h24M153 99h24"
            stroke={p.artCopperShade}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
      </G>
    );
  return (
    <Svg
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      height={height}
      width="100%"
      viewBox="0 0 240 160"
    >
      <Defs>
        {gradient('v', p.artViolet, p.artPurple)}
        {gradient('p', p.artPaper, p.artBlue)}
        {gradient('g', p.artMint, p.artGreen)}
        {gradient('c', p.artPeach, p.artCopper)}
      </Defs>
      {scene}
    </Svg>
  );
}

export function discoveryKind(key: string): DiscoveryKind {
  if (
    [
      'rooms',
      'rides',
      'jobs',
      'community',
      'events',
      'marketplace',
      'referrals',
      'expenses',
    ].includes(key)
  )
    return key as DiscoveryKind;
  return 'essentials';
}
