# Design: Child-Friendly UX System

## Context
This application targets Hong Kong primary school students (小一至小六, ages 6-12). The current design uses a professional blue-gray palette suited for adults, not children. Research shows that children engage better with colorful, playful interfaces that provide immediate feedback.

## Goals
- Make learning feel like play, not work
- Ensure readability for developing readers
- Support touch-first interaction (iPad)
- Maintain accessibility standards

## Non-Goals
- Complete UI framework rewrite
- Backend changes
- Complex animation libraries
- User accounts or gamification systems (future scope)

## Decisions

### Decision 1: Color Palette
**Choice**: Warm, nature-inspired palette with pastel variants

| Color | Usage | Hex |
|-------|-------|-----|
| Coral | Primary actions, highlights | `#FF6B6B` |
| Peach | Backgrounds, warmth | `#FFE5B4` |
| Mint | Success, correct | `#98D8AA` |
| Sky Blue | Links, information | `#7EC8E3` |
| Golden | Stars, achievements | `#FFD93D` |
| Cream | Card backgrounds | `#FFF8E7` |
| Charcoal | Text (high contrast) | `#2D3436` |

**Rationale**: Warm colors feel welcoming; pastels reduce visual fatigue; nature themes resonate across cultures.

### Decision 2: Typography Scale

| Element | Size | Weight |
|---------|------|--------|
| H1 (Page title) | 36px | Bold |
| H2 (Section title) | 28px | Semibold |
| H3 (Card title) | 22px | Semibold |
| Body | 18px | Regular |
| Small | 16px | Regular |
| Hanzi Large | 160px | - |
| Hanzi Medium | 80px | - |
| Jyutping | 26px | Mono |

**Rationale**: Larger sizes aid developing readers; consistent scale creates hierarchy.

### Decision 3: Touch Target Sizes

| Element | Min Size | Recommended |
|---------|----------|-------------|
| Buttons | 48x48px | 56x48px |
| Nav arrows | 56x56px | 72x72px |
| Cards | Full width | Full width |
| Dropdowns | 48px height | 56px height |
| Spacing between targets | 8px | 12px |

**Rationale**: Apple HIG recommends 44px minimum; we exceed this for clumsy young fingers.

### Decision 4: Mascot System
Each activity gets a friendly animal mascot that appears on cards and provides encouragement (using 書面語 Standard Written Chinese):

- **小熊貓** (Panda) - 認識漢字: "一起學習漢字！"
- **小白兔** (Rabbit) - 字卡温習: "開始字卡練習！"
- **小猴子** (Monkey) - 拆字遊戲: "拆字真有趣！"
- **貓頭鷹** (Owl) - 默書練習: "專心聆聽！"

**Rationale**: Animal mascots are universally appealing, culturally neutral, and create emotional connection. All messages use Standard Written Chinese (書面語) per project guidelines.

### Decision 5: Animation & Feedback
- **Correct answer**: Stars burst + encouraging message + subtle sound
- **Wrong answer**: Gentle shake + try again message (no negative sounds)
- **Navigation**: Smooth slide transitions (300ms)
- **Loading**: Bouncing mascot animation
- **Buttons**: Scale up on hover/press (1.05x)

**Rationale**: Immediate positive feedback reinforces learning; avoid discouraging incorrect attempts.

## Alternatives Considered

### Alt 1: Game-like themes (rejected)
Full gamification with points, levels, leaderboards. Rejected as scope creep - can be added later.

### Alt 2: Dark mode only with bright accents (rejected)
While trendy, dark mode is harder for young readers and can feel cold.

### Alt 3: Emoji-only icons (partial)
Using system emoji is inconsistent across platforms. We'll use custom SVG mascots with emoji fallbacks.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Larger assets increase load time | Optimize images, use SVG, lazy load |
| Bright colors may fatigue eyes | Use pastels, soft gradients |
| Touch targets reduce content density | Single-purpose screens, pagination |
| Mascot images need creation | Start with emoji, iterate with illustrations |

## Implementation Approach
1. Update CSS custom properties for new palette
2. Create reusable UI components (Button, Card, NavArrow)
3. Update homepage with new design
4. Apply to each learning component incrementally
5. Add mascot images and animations last

## Open Questions
- [ ] Should we support theme customization (color preferences)?
- [ ] Add sound effects? (accessibility concern - must be toggleable)
- [ ] Should mascots have names that students can learn?
