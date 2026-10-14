package com.manabandhu.backend.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.UUID;

import org.junit.jupiter.api.Test;

/** GraphQL hides the same user ids that the REST read models (PostView, CommentView) leave out. */
class CommunityPostGraphqlControllerTest {

    private final CommunityPostGraphqlController controller =
            new CommunityPostGraphqlController(mock(CommunityPostService.class));

    @Test
    void userIdFieldsResolveToNull() {
        assertThat(controller.postOwnerId(new CommunityPost(UUID.randomUUID(), UUID.randomUUID(), "T", "B"))).isNull();
        assertThat(controller.commentAuthorId(mock(PostComment.class))).isNull();
        assertThat(controller.reactionUserId(mock(PostReaction.class))).isNull();
    }
}
