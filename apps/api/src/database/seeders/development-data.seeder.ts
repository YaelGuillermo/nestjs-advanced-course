// src/database/seeders/development-data.seeder.ts
import * as bcrypt from 'bcrypt';
import { UserAvatar } from 'src/modules/accounts/users/entities/user-avatar.entity';
import { User } from 'src/modules/accounts/users/entities/user.entity';
import { AuthProvider } from 'src/modules/accounts/users/enums/auth-provider.enum';
import { UserRole } from 'src/modules/accounts/users/enums/user-role.enum';
import { UserFollow } from 'src/modules/threads/follows/entities/user-follow.entity';
import { FollowStatus } from 'src/modules/threads/follows/enums/follow-status.enum';
import { PostImage } from 'src/modules/threads/posts/entities/post-image.entity';
import { Post } from 'src/modules/threads/posts/entities/post.entity';
import { PostReplyPolicy } from 'src/modules/threads/posts/enums/post-reply-policy.enum';
import { Reaction } from 'src/modules/threads/reactions/entities/reaction.entity';
import { ReactionEmoji } from 'src/modules/threads/reactions/enums/reaction-emoji.enum';
import type { DataSource, EntityManager } from 'typeorm';
import type { DevelopmentSeedConfig } from './development-seed.config';
import { createSeedRandom, type SeedRandom } from './seed-random.util';

export interface DevelopmentSeedSummary {
  users: number;
  userAvatars: number;
  follows: number;
  posts: number;
  rootPosts: number;
  replies: number;
  postImages: number;
  reactions: number;
  seedPassword: string;
}

type SeededPostCollections = {
  posts: Post[];
  rootPosts: Post[];
  replies: Post[];
};

const SEED_PASSWORD = 'SeedUser123!';

const FIRST_NAMES = [
  'Alex',
  'Maya',
  'Noah',
  'Luna',
  'Sofia',
  'Leo',
  'Iris',
  'Mateo',
  'Nora',
  'Eli',
  'Ava',
  'Gael',
  'Emma',
  'Liam',
  'Mia',
  'Theo',
  'Zoe',
  'Ian',
] as const;

const LAST_NAMES = [
  'Rivera',
  'Stone',
  'Morgan',
  'Reyes',
  'Torres',
  'Kim',
  'Carter',
  'Flores',
  'Hayes',
  'Vega',
  'Brooks',
  'Santos',
  'Ramos',
  'Bennett',
  'Cruz',
  'Parker',
  'Silva',
  'Mendez',
] as const;

const ROOT_POST_TOPICS = [
  'Building a cleaner NestJS module structure today.',
  'Testing a new feed layout with threads and replies.',
  'Refactoring database scripts to keep maintenance predictable.',
  'Trying a minimal UI direction for the social timeline.',
  'Documenting the rules for reactions and follows.',
  'Reviewing how nested replies should appear in the product.',
  'Preparing a dataset for local development demos.',
  'Improving the developer experience around seed data.',
  'Thinking about how to make pagination feel faster.',
  'Polishing the response envelope consistency across modules.',
] as const;

const REPLY_TEMPLATES = [
  'This is a solid direction; I would keep it simple and scalable.',
  'Agree. The important part is making the rule easy to test.',
  'Nice. This also gives us better data for local demos.',
  'I would add one more case for nested replies here.',
  'This feels consistent with the rest of the API design.',
  'Good point. The relation shape should stay predictable.',
  'This is exactly the kind of seed data the frontend needs.',
  'The next step should be validating it with pagination enabled.',
  'Great call. This keeps the module easier to maintain.',
  'I like this because it avoids coupling tests with seed scripts.',
] as const;

const POST_REPLY_POLICIES = [
  PostReplyPolicy.ANYONE,
  PostReplyPolicy.FOLLOWERS,
  PostReplyPolicy.FOLLOWING,
  PostReplyPolicy.MUTUALS,
] as const;

const FOLLOW_STATUSES = [
  FollowStatus.ACCEPTED,
  FollowStatus.ACCEPTED,
  FollowStatus.ACCEPTED,
  FollowStatus.PENDING,
  FollowStatus.REJECTED,
] as const;

const REACTION_EMOJIS = [
  ReactionEmoji.LOVE,
  ReactionEmoji.LAUGH,
  ReactionEmoji.LIKE,
  ReactionEmoji.WOW,
  ReactionEmoji.SAD,
  ReactionEmoji.ANGRY,
] as const;

function padIndex(index: number): string {
  return String(index + 1).padStart(3, '0');
}

function normalizeUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

function makeImageFields(
  random: SeedRandom,
  folder: string,
  basename: string,
  order?: number,
) {
  const token = random.hex(18);
  const extension = 'png';
  const path = `${folder}/${basename}-${token}.${extension}`;

  return {
    path,
    originalName: `${basename}-${token}.${extension}`.slice(0, 256),
    mimeType: 'image/png',
    sizeBytes: String(random.int(24_000, 4_800_000)),
    extension,
    checksumSha256: random.hex(64),
    width: random.int(320, 1920),
    height: random.int(320, 1920),
    ...(order === undefined ? {} : { order }),
  };
}

export class DevelopmentDataSeeder {
  private readonly random: SeedRandom;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: DevelopmentSeedConfig,
  ) {
    this.random = createSeedRandom(config.seed);
  }

  async seed(): Promise<DevelopmentSeedSummary> {
    return this.dataSource.transaction(async (manager) => {
      const users = await this.seedUsers(manager);
      const userAvatars = await this.seedUserAvatars(manager, users);
      const follows = await this.seedFollows(manager, users);
      const seededPosts = await this.seedPosts(manager, users);
      const postImages = await this.seedPostImages(manager, seededPosts.posts);
      const reactions = await this.seedReactions(
        manager,
        users,
        seededPosts.posts,
      );

      return {
        users: users.length,
        userAvatars: userAvatars.length,
        follows: follows.length,
        posts: seededPosts.posts.length,
        rootPosts: seededPosts.rootPosts.length,
        replies: seededPosts.replies.length,
        postImages: postImages.length,
        reactions: reactions.length,
        seedPassword: SEED_PASSWORD,
      };
    });
  }

  private async seedUsers(manager: EntityManager): Promise<User[]> {
    const repository = manager.getRepository(User);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const users = Array.from({ length: this.config.users }, (_, index) => {
      const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
      const lastName = LAST_NAMES[index % LAST_NAMES.length];
      const suffix = padIndex(index);
      const username = normalizeUsername(`${firstName}_${lastName}_${suffix}`);

      return repository.create({
        username,
        firstName,
        lastName,
        email: `${username}@seed.local`,
        password: passwordHash,
        provider: AuthProvider.LOCAL,
        role:
          index === 0
            ? UserRole.ADMIN
            : index === 1
              ? UserRole.STAFF
              : UserRole.USER,
        isActive: true,
        isEmailVerified: this.random.bool(0.86),
        lastLoginAt: this.random.bool(0.62)
          ? new Date(Date.now() - this.random.int(1, 30) * 86_400_000)
          : null,
      });
    });

    return repository.save(users);
  }

  private async seedUserAvatars(
    manager: EntityManager,
    users: readonly User[],
  ): Promise<UserAvatar[]> {
    if (this.config.skipAvatars) {
      return [];
    }

    const repository = manager.getRepository(UserAvatar);
    const avatars = users
      .filter(() => this.random.bool(0.78))
      .map((user) =>
        repository.create({
          userId: user.id,
          sourceUrl: `https://seed.local/avatars/${user.username}.png`,
          ...makeImageFields(
            this.random,
            'uploads/users/avatars',
            `avatar-${user.username}`,
          ),
        }),
      );

    return repository.save(avatars);
  }

  private async seedFollows(
    manager: EntityManager,
    users: readonly User[],
  ): Promise<UserFollow[]> {
    const repository = manager.getRepository(UserFollow);
    const follows: UserFollow[] = [];
    const pairs = new Set<string>();

    const addFollow = (user: User, target: User): void => {
      if (user.id === target.id) {
        return;
      }

      const key = `${user.id}:${target.id}`;

      if (pairs.has(key)) {
        return;
      }

      pairs.add(key);
      follows.push(
        repository.create({
          userId: user.id,
          targetId: target.id,
          status: this.random.pick(FOLLOW_STATUSES),
        }),
      );
    };

    for (const user of users) {
      for (const target of users) {
        if (this.random.bool(this.config.followDensity)) {
          addFollow(user, target);
        }
      }
    }

    for (const user of users) {
      const candidates = this.random
        .shuffle(users)
        .filter((candidate) => candidate.id !== user.id)
        .slice(0, this.random.int(1, Math.min(3, users.length - 1)));

      candidates.forEach((target) => addFollow(user, target));
    }

    return repository.save(follows);
  }

  private async seedPosts(
    manager: EntityManager,
    users: readonly User[],
  ): Promise<SeededPostCollections> {
    const repository = manager.getRepository(Post);
    const posts: Post[] = [];
    const rootPosts: Post[] = [];
    const replies: Post[] = [];

    for (let index = 0; index < this.config.rootPosts; index += 1) {
      const author = this.random.pick(users);
      const topic = this.random.pick(ROOT_POST_TOPICS);

      const rootPost = await repository.save(
        repository.create({
          content: `${topic} #${padIndex(index)}`,
          replyPolicy: this.random.pick(POST_REPLY_POLICIES),
          authorId: author.id,
          parentId: null,
        }),
      );

      posts.push(rootPost);
      rootPosts.push(rootPost);

      const rootReplies: Post[] = [];
      const repliesCount = this.random.int(
        this.config.minRepliesPerRoot,
        this.config.maxRepliesPerRoot,
      );

      for (let replyIndex = 0; replyIndex < repliesCount; replyIndex += 1) {
        const replyAuthor = this.random.pick(users);
        const shouldNest =
          rootReplies.length > 0 &&
          this.random.bool(this.config.nestedReplyChance);
        const parent = shouldNest ? this.random.pick(rootReplies) : rootPost;

        const reply = await repository.save(
          repository.create({
            content: `${this.random.pick(REPLY_TEMPLATES)} Reply ${padIndex(replyIndex)} for post ${padIndex(index)}.`,
            replyPolicy: PostReplyPolicy.ANYONE,
            authorId: replyAuthor.id,
            parentId: parent.id,
          }),
        );

        posts.push(reply);
        replies.push(reply);
        rootReplies.push(reply);
      }
    }

    return { posts, rootPosts, replies };
  }

  private async seedPostImages(
    manager: EntityManager,
    posts: readonly Post[],
  ): Promise<PostImage[]> {
    if (this.config.skipImages) {
      return [];
    }

    const repository = manager.getRepository(PostImage);
    const images: PostImage[] = [];

    for (const post of posts) {
      if (!this.random.bool(this.config.imageChance)) {
        continue;
      }

      const imagesCount = this.random.int(1, 2);

      for (let order = 0; order < imagesCount; order += 1) {
        images.push(
          repository.create({
            postId: post.id,
            ...makeImageFields(
              this.random,
              'uploads/threads/posts',
              `post-${post.id.slice(0, 8)}-${order}`,
              order,
            ),
          }),
        );
      }
    }

    return repository.save(images);
  }

  private async seedReactions(
    manager: EntityManager,
    users: readonly User[],
    posts: readonly Post[],
  ): Promise<Reaction[]> {
    const repository = manager.getRepository(Reaction);
    const reactions: Reaction[] = [];

    for (const post of posts) {
      const reactors = this.random
        .shuffle(users)
        .slice(0, Math.min(users.length, this.config.reactionsPerPost));

      for (const user of reactors) {
        reactions.push(
          repository.create({
            userId: user.id,
            postId: post.id,
            emoji: this.random.pick(REACTION_EMOJIS),
          }),
        );
      }
    }

    return repository.save(reactions);
  }
}
