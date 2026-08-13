package com.manabandhu.backend.foundation;

import java.util.List;

public record WelcomeFlow(SplashContent splash, List<WelcomeStep> steps) {
}
