package com.manabandhu.backend.foundation;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class FoundationContentService {

    private static final String HELP_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLuihH-mSVxYhIAX0g3XSpYMHRaSs0kbK5uQCKWYinPX-8Gkfl0D6QOOYna7jkBL-XBFoAgVulXErCpyQxyPCXcAFjLvy8jUchV2mluO1-uL1mm0N53J5icFnoXEut4vWkPDovzsDhbjMYB3SbmrvZvVAFyhDinQIniIh2UHI3jjzSfcdaU86ZtypYnANXAoePqFb5RoSedJnEh9vDlYoCc5JD_MXTe_2yhbvQKJTTzwkevVyWz28B_ktfg";
    private static final String TRUST_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLtUf2ODs2thv2Z3Tn-zrq2aaYnq5daSL9KBeeHzLFYPNJDJO4vD7UcsoIaltEvAbFrubE_vZrNGdGO7BzEX972UyQL9JthY2LS5FgRQMeLeAS43Xo2flktTuSUyxHVbfsTJ4G76kcuaR1yjJrSb6yZIoYTXfaPKaAkfNWGohBFMJV2Oa5QuO7-okaQO5kx7T2Gw7fqG8KggE0Vdny10VVgAS-d0JbHYNSThckQ6FCLQaVD-scfhzIQK9x8";
    private static final String LIFE_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLsnX0Z0wRXO1bksJlF36mVKcxGpWmLHDKh29_dDO-daHA-WP1kZN6-es7SZecpR_E9zdLoffF80G3fOX9M0i3_caLaWhTKfh0-eg85lYLp4mxvpEOp4DdqjjekgMhByhMLrJggPuIra_sofSIGmHJ6DnTE4EOKEaGGD04XoInVhxLtiYar_nTsvhPklWvpaxQOZ_9-FLtTUoVx71PxgUfThSVk0lbXBgQ0v1ODZt0a9mZ_Z62QyFc52xCs";
    private static final String LOGO_IMAGE_URL =
            "https://lh3.googleusercontent.com/aida/AP1WRLs0M1VGWNL3Xb3bF48xlOO2okf2eA24_UPS48maqbG97LuRBxmy4MWa1EtNlhOccVHifqVSUVIZMEU8-z8rsfgeyO65DQnP88qQz663DzrUX5es6RnPDkfASjguVcvCdVPEuRyVOuxZ4LzuBAmnL56HffFOvvkN2RrEaQhGap8pFXIfd0PjH3E596K6DQ8MhlhExd20h3bM-ZC8fNpNcwXcNxyHpAQr2WRcOw-EuyZ0y25eWiUrN-9RUg";

    WelcomeFlow welcomeFlow() {
        return new WelcomeFlow(
                new SplashContent("ManaBandhu", "Your trusted community, wherever you are.", LOGO_IMAGE_URL),
                List.of(
                        new WelcomeStep(
                                "find-help",
                                "Find the help you need",
                                "Rooms, rides, jobs, local services, and useful information in one friendly app.",
                                HELP_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "trusted-community",
                                "Connect with people you can trust",
                                "Ask questions, join communities, chat safely, and meet people nearby.",
                                TRUST_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "everyday-life",
                                "Make everyday life easier.",
                                "Share expenses, find events, track packages, and stay organized.",
                                LIFE_IMAGE_URL,
                                "Next",
                                null),
                        new WelcomeStep(
                                "get-started",
                                "Welcome to ManaBandhu",
                                "Your global community for meaningful connections and support is ready.",
                                LOGO_IMAGE_URL,
                                "Get Started",
                                "Sign In")));
    }
}
