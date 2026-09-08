package com.manabandhu.backend.chat;

import java.util.UUID;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageInput input, SimpMessageHeaderAccessor accessor) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }
        var userId = UUID.fromString(authentication.getName());
        accessor.getSessionAttributes().put("userId", userId.toString());
    }
}
