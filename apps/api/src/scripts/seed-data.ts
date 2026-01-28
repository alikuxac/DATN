import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import {
  ENUM_USER_ROLE,
  ENUM_USER_SIGN_UP_FROM,
  ENUM_USER_STATUS,
  ENUM_USER_GENDER,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_TYPE,
  ENUM_REPORT_SOURCE,
  ENUM_MESSAGE_LANGUAGE,
  ENUM_USER_THEME,
  ENUM_SHELTER_TYPE,
  ENUM_SHELTER_STATUS,
  ENUM_REPORT_LOCATION_TYPE,
} from '@repo/shared';
import { Model } from 'mongoose';
import { UserDocument, UserEntity } from '@modules/users/repository/entities/user.entity';
import { ReportDocument, ReportEntity } from '@modules/reports/repository/entities/report.entity';
import { ShelterDocument, ShelterEntity } from '@modules/shelters/repository/entities/shelter.entity';
import { getModelToken } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from '@common/database/constants/database.constant';

// ==================== CONSTANTS ====================

const VIETNAM_CLUSTERS = [
  // Major Cities
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, regionId: 'ha-noi' },
  { name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297, regionId: 'tp-ho-chi-minh' },
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, regionId: 'da-nang' },

  // Bắc Trung Bộ
  { name: 'Thanh Hóa', lat: 19.8075, lng: 105.7764, regionId: 'thanh-hoa' },
  { name: 'Nghệ An', lat: 18.6653, lng: 105.6795, regionId: 'nghe-an' },
  { name: 'Hà Tĩnh', lat: 18.3580, lng: 105.8906, regionId: 'ha-tinh' },
  { name: 'Quảng Trị', lat: 16.7865, lng: 107.1350, regionId: 'quang-tri' },
  { name: 'Huế', lat: 16.4637, lng: 107.5909, regionId: 'hue' }, // Thừa Thiên Huế

  // Nam Trung Bộ
  { name: 'Quảng Ngãi', lat: 15.1205, lng: 108.7915, regionId: 'quang-ngai' },
  { name: 'Khánh Hòa', lat: 12.2388, lng: 109.1967, regionId: 'khanh-hoa' },

  // Đông Bắc Bộ (Bão, Lũ lụt)
  { name: 'Quảng Ninh', lat: 21.0069, lng: 107.2925, regionId: 'quang-ninh' },
  { name: 'Hải Phòng', lat: 20.8561, lng: 106.6822, regionId: 'hai-phong' },
  { name: 'Lạng Sơn', lat: 21.8477, lng: 106.7580, regionId: 'lang-son' },

  // Tây Bắc Bộ (Sạt lở đất)
  { name: 'Lào Cai', lat: 22.4856, lng: 103.9707, regionId: 'lao-cai' },
  { name: 'Sơn La', lat: 21.3259, lng: 103.9816, regionId: 'son-la' },
];


const PEAK_HOURS = [
  { start: 7, end: 9 },
  { start: 17, end: 20 },
  { start: 11, end: 13 },
];

const VN_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const VN_MIDDLE_NAMES = ['Văn', 'Thị', 'Ngọc', 'Minh', 'Đức', 'Duy', 'Hoàng', 'Thanh', 'Quang', 'Hữu', 'Kim', 'Xuân', 'Công', 'Gia', 'Bảo'];
const VN_FIRST_NAMES = [
  'An', 'Anh', 'Bình', 'Châu', 'Chi', 'Cường', 'Dũng', 'Dương', 'Đạt', 'Đông', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu',
  'Hoa', 'Hoà', 'Hùng', 'Huy', 'Khánh', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Nga', 'Ngân', 'Ngọc', 'Nhung',
  'Phong', 'Phúc', 'Phương', 'Quân', 'Quang', 'Quỳnh', 'Sơn', 'Thảo', 'Thắng', 'Thành', 'Thảo', 'Thủy', 'Toàn', 'Trang',
  'Trung', 'Tuấn', 'Tùng', 'Vân', 'Việt', 'Vinh', 'Yến', 'Tú', 'Thiện', 'Nhân', 'Nghĩa', 'Lễ', 'Trí', 'Tín'
];

const SHELTER_NAMES = [
  'Nhà văn hóa', 'Trường tiểu học', 'Trường trung học', 'Ủy ban nhân dân', 'Trung tâm y tế', 'Nhà thi đấu', 'Chùa', 'Nhà thờ'
];

const DEFAULT_PASSWORD = 'Password123!';

function getVietnameseName() {
  const last = VN_LAST_NAMES[Math.floor(Math.random() * VN_LAST_NAMES.length)];
  const middle = VN_MIDDLE_NAMES[Math.floor(Math.random() * VN_MIDDLE_NAMES.length)];
  const first = VN_FIRST_NAMES[Math.floor(Math.random() * VN_FIRST_NAMES.length)];
  return { firstName: `${middle} ${first}`, lastName: last };
}


// ==================== HELPER FUNCTIONS ====================

function parseArgs(): { emailDomain: string; userCount: number } {
  const args = process.argv.slice(2);
  let emailDomain = '@cuutro.alikuxac.xyz';
  let userCount = 90;

  args.forEach((arg) => {
    if (arg.startsWith('--email-domain=')) {
      emailDomain = arg.split('=')[1];
      if (!emailDomain.startsWith('@')) {
        emailDomain = '@' + emailDomain;
      }
    }
    if (arg.startsWith('--user-count=')) {
      userCount = parseInt(arg.split('=')[1], 10);
      if (userCount >= 1000) {
        console.warn('⚠️  User count must be < 1000, setting to 200');
        userCount = 200;
      }
    }

  });

  return { emailDomain, userCount };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

function biasedRandomDate(daysAgo: number, bias: 'start' | 'end' = 'end', peakHours = true): Date {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysAgo);

  let randomFactor = Math.random();

  // Exponential bias to simulate growth (more users/reports towards the end)
  if (bias === 'end') {
    randomFactor = Math.pow(randomFactor, 0.3); // Curve pushes values towards 1 (end)
  } else {
    randomFactor = Math.pow(randomFactor, 3); // Curve pushes values towards 0 (start)
  }

  const randomMs = randomFactor * (now.getTime() - startDate.getTime());
  const date = new Date(startDate.getTime() + randomMs);

  if (peakHours && Math.random() > 0.3) {
    const peak = PEAK_HOURS[Math.floor(Math.random() * PEAK_HOURS.length)];
    date.setHours(peak.start + Math.floor(Math.random() * (peak.end - peak.start)));
    date.setMinutes(Math.floor(Math.random() * 60));
  }

  return date;
}



function randomDate(daysAgo: number, peakHours = true): Date {
  return biasedRandomDate(daysAgo, 'end', peakHours);
}

function getRandomCluster() {
  return VIETNAM_CLUSTERS[Math.floor(Math.random() * VIETNAM_CLUSTERS.length)];
}

function randomCoordinatesInCluster(
  clusterLat: number,
  clusterLng: number,
  radiusKm: number = 5
): { lat: number; lng: number } {
  // Convert radius to degrees (rough approximation: 1 degree ≈ 111km)
  const radiusDeg = radiusKm / 111;

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusDeg; // Square root for uniform distribution in circle

  const lat = clusterLat + distance * Math.cos(angle);
  const lng = clusterLng + distance * Math.sin(angle);

  return { lat, lng };
}


function randomPhoneNumber(): string {
  const prefixes = ['03', '05', '07', '08', '09'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${number}`;
}

// ==================== DATA GENERATION ====================

async function generateUsers(
  userModel: Model<UserDocument>,
  emailDomain: string,
  totalCount: number
): Promise<UserDocument[]> {
  console.log(`\n📝 Generating ${totalCount} users...`);

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  const users: any[] = [];

  // 1 Super Admin
  users.push({
    email: `superadmin${emailDomain}`,
    firstName: 'Super',
    lastName: 'Admin',
    gender: ENUM_USER_GENDER.OTHER,
    password: hashedPassword,
    passwordExpiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    passwordCreatedAt: new Date(),
    passwordAttempts: 0,
    isRescueMode: false,
    signUpDate: randomDate(30, false),
    signUpFrom: ENUM_USER_SIGN_UP_FROM.SEED,
    status: ENUM_USER_STATUS.ACTIVE,
    role: ENUM_USER_ROLE.SUPER_ADMIN,
    mobileNumber: randomPhoneNumber(),
    verification: {
      email: true,
      emailVerfiedAt: new Date(),
      mobileNumber: true,
      mobileNumberVerifiedAt: new Date(),
    },
    preferences: {
      language: ENUM_MESSAGE_LANGUAGE.VI,
      theme: ENUM_USER_THEME.LIGHT,
    },
    settings: {
      pushEnabled: true,
      sosAlerts: true,
      activityUpdates: true,
      newsLetters: true,
    },
  });

  // 2 Admins
  for (let i = 0; i < 2; i++) {
    const { firstName, lastName } = getVietnameseName();
    users.push({
      email: `admin${i + 1}${emailDomain}`,
      firstName,
      lastName,
      gender: weightedRandom(
        [ENUM_USER_GENDER.MALE, ENUM_USER_GENDER.FEMALE, ENUM_USER_GENDER.OTHER],
        [45, 45, 10]
      ),
      password: hashedPassword,
      passwordExpiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      passwordCreatedAt: new Date(),
      passwordAttempts: 0,
      isRescueMode: false,
      signUpDate: randomDate(30, false),
      signUpFrom: ENUM_USER_SIGN_UP_FROM.SEED,
      status: ENUM_USER_STATUS.ACTIVE,
      role: ENUM_USER_ROLE.ADMIN,
      mobileNumber: randomPhoneNumber(),
      verification: {
        email: true,
        emailVerfiedAt: new Date(),
        mobileNumber: true,
        mobileNumberVerifiedAt: new Date(),
      },
      preferences: {
        language: ENUM_MESSAGE_LANGUAGE.VI,
        theme: weightedRandom([ENUM_USER_THEME.LIGHT, ENUM_USER_THEME.DARK], [60, 40]),
      },
      settings: {
        pushEnabled: true,
        sosAlerts: true,
        activityUpdates: true,
        newsLetters: true,
      },
    });
  }

  // Volunteers (15-20)
  const volunteerCount = 15 + Math.floor(Math.random() * 6);
  for (let i = 0; i < volunteerCount; i++) {
    const emailVerified = Math.random() > 0.1; // 90% verified email
    const phoneVerified = emailVerified && Math.random() > 0.2; // 80% verified phone if email verified
    const { firstName, lastName } = getVietnameseName();

    users.push({
      email: `volunteer${i + 1}${emailDomain}`,
      firstName,
      lastName,
      gender: weightedRandom(
        [ENUM_USER_GENDER.MALE, ENUM_USER_GENDER.FEMALE, ENUM_USER_GENDER.OTHER],
        [45, 45, 10]
      ),
      password: hashedPassword,
      passwordExpiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      passwordCreatedAt: new Date(),
      passwordAttempts: 0,
      isRescueMode: Math.random() > 0.7, // 30% in rescue mode
      signUpDate: randomDate(30, false),
      signUpFrom: ENUM_USER_SIGN_UP_FROM.SEED,
      status: ENUM_USER_STATUS.ACTIVE,
      role: ENUM_USER_ROLE.VOLUNTEER,
      mobileNumber: randomPhoneNumber(),
      verification: {
        email: emailVerified,
        emailVerfiedAt: emailVerified ? randomDate(25) : undefined,
        mobileNumber: phoneVerified,
        mobileNumberVerifiedAt: phoneVerified ? randomDate(20) : undefined,
      },
      preferences: {
        language: ENUM_MESSAGE_LANGUAGE.VI,
        theme: weightedRandom([ENUM_USER_THEME.LIGHT, ENUM_USER_THEME.DARK], [50, 50]),
      },
      settings: {
        pushEnabled: true,
        sosAlerts: true,
        activityUpdates: Math.random() > 0.3,
        newsLetters: Math.random() > 0.5,
      },
    });
  }

  // Regular Users (remaining)
  const regularUserCount = totalCount - users.length;
  for (let i = 0; i < regularUserCount; i++) {
    const verificationState = weightedRandom(
      ['both', 'email-only', 'none'],
      [40, 30, 30]
    );

    const emailVerified = verificationState !== 'none';
    const phoneVerified = verificationState === 'both';
    const { firstName, lastName } = getVietnameseName();

    users.push({
      email: `user${i + 1}${emailDomain}`,
      firstName,
      lastName,
      gender: weightedRandom(
        [ENUM_USER_GENDER.MALE, ENUM_USER_GENDER.FEMALE, ENUM_USER_GENDER.OTHER],
        [45, 45, 10]
      ),
      password: hashedPassword,
      passwordExpiredAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      passwordCreatedAt: new Date(),
      passwordAttempts: 0,
      isRescueMode: false,
      signUpDate: biasedRandomDate(30, 'end'), // Growth curve
      signUpFrom: ENUM_USER_SIGN_UP_FROM.SEED,
      status: ENUM_USER_STATUS.ACTIVE,
      role: ENUM_USER_ROLE.USER,
      mobileNumber: randomPhoneNumber(),
      verification: {
        email: emailVerified,
        emailVerfiedAt: emailVerified ? randomDate(25) : undefined,
        mobileNumber: phoneVerified,
        mobileNumberVerifiedAt: phoneVerified ? randomDate(20) : undefined,
      },
      preferences: {
        language: ENUM_MESSAGE_LANGUAGE.VI,
        theme: weightedRandom([ENUM_USER_THEME.LIGHT, ENUM_USER_THEME.DARK], [60, 40]),
      },
      settings: {
        pushEnabled: Math.random() > 0.2,
        sosAlerts: Math.random() > 0.1,
        activityUpdates: Math.random() > 0.4,
        newsLetters: Math.random() > 0.6,
      },
    });
  }


  const createdUsers = await userModel.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  console.log(`   - 1 Super Admin`);
  console.log(`   - 2 Admins`);
  console.log(`   - ${volunteerCount} Volunteers`);
  console.log(`   - ${regularUserCount} Regular Users`);

  return createdUsers as UserDocument[];
}

async function generateReports(
  reportModel: Model<ReportDocument>,
  users: UserDocument[]
): Promise<ReportDocument[]> {
  console.log(`\n📍 Generating reports...`);

  const reports: any[] = [];
  const regularUsers = users.filter((u) => u.role === ENUM_USER_ROLE.USER);

  // 60-80% of users create reports
  const reportingUsers = regularUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(regularUsers.length * (0.6 + Math.random() * 0.2)));

  reportingUsers.forEach((user) => {
    // Each user creates 1-3 reports
    const reportCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < reportCount; i++) {
      const cluster = getRandomCluster();
      // Increase radius for reports to specific cluster
      const coords = randomCoordinatesInCluster(cluster.lat, cluster.lng, 8);
      const createdAt = randomDate(30);

      const status = weightedRandom(
        [
          ENUM_REPORT_STATUS.PENDING,
          ENUM_REPORT_STATUS.IN_PROGRESS,
          ENUM_REPORT_STATUS.RESOLVED,
          ENUM_REPORT_STATUS.REJECTED,
        ],
        [20, 25, 45, 10] // More resolved reports for better stats
      );

      reports.push({
        user: user._id,
        by: user._id,
        location: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat],
        },
        notes: faker.lorem.sentence(),
        severity: weightedRandom(
          [
            ENUM_REPORT_SEVERITY.LOW,
            ENUM_REPORT_SEVERITY.MEDIUM,
            ENUM_REPORT_SEVERITY.HIGH,
            ENUM_REPORT_SEVERITY.CRITICAL,
          ],
          [30, 50, 15, 5]
        ),
        status,
        peopleCount: 1 + Math.floor(Math.random() * 5),
        isPublic: true,
        type: weightedRandom(
          [
            ENUM_REPORT_TYPE.FOOD,
            ENUM_REPORT_TYPE.WATER,
            ENUM_REPORT_TYPE.MEDICAL,
            ENUM_REPORT_TYPE.EVACUATION,
            ENUM_REPORT_TYPE.OTHER,
          ],
          [25, 25, 20, 20, 10]
        ),
        regionId: cluster.regionId,
        images: [],
        source: ENUM_REPORT_SOURCE.APP,
        isVerified: true,
        isProxyReport: false,
        createdAt,
        updatedAt: createdAt,
      });
    }
  });

  const createdReports = await reportModel.insertMany(reports);
  console.log(`✅ Created ${createdReports.length} reports`);

  return createdReports as ReportDocument[];
}

async function assignVolunteersToReports(
  reportModel: Model<ReportDocument>,
  reports: ReportDocument[],
  users: UserDocument[]
): Promise<void> {
  console.log(`\n👥 Assigning volunteers to reports...`);

  const volunteers = users.filter((u) => u.role === ENUM_USER_ROLE.VOLUNTEER);
  const assignableReports = reports.filter(
    (r) =>
      r.status === ENUM_REPORT_STATUS.IN_PROGRESS ||
      r.status === ENUM_REPORT_STATUS.RESOLVED ||
      r.status === ENUM_REPORT_STATUS.REJECTED
  );

  let assignedCount = 0;

  // Split into small batches to simulate workers
  const BATCH_SIZE = 50;
  const operations: any[] = [];

  for (const report of assignableReports) {
    if (Math.random() > 0.7) continue;

    const volunteer = volunteers[Math.floor(Math.random() * volunteers.length)];
    const responseMinutes = 5 + Math.floor(Math.random() * 50);
    const acceptedAt = new Date(report.createdAt.getTime() + responseMinutes * 60 * 1000);

    const updateData: any = {
      rescuer: volunteer._id,
      acceptedAt,
    };

    // Ensure valid timestamps for stats
    if (report.status === ENUM_REPORT_STATUS.RESOLVED) {
      const resolveMinutes = 10 + Math.floor(Math.random() * 110);
      updateData.resolvedAt = new Date(acceptedAt.getTime() + resolveMinutes * 60 * 1000);
    } else if (report.status === ENUM_REPORT_STATUS.REJECTED) {
      const rejectMinutes = 5 + Math.floor(Math.random() * 25);
      updateData.rejectedAt = new Date(acceptedAt.getTime() + rejectMinutes * 60 * 1000);
      updateData.rejectReason = faker.lorem.sentence();
    }

    operations.push({
      updateOne: {
        filter: { _id: report._id },
        update: { $set: updateData },
      },
    });
    assignedCount++;
  }

  // Execute in batches
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);
    if (batch.length > 0) {
      await reportModel.bulkWrite(batch);
    }
  }

  console.log(`✅ Assigned ${assignedCount} volunteers to reports (optimized with bulkWrite)`);

}

async function generateShelters(
  shelterModel: Model<ShelterDocument>
): Promise<ShelterDocument[]> {
  console.log(`\n🏠 Generating shelters...`);
  const shelters: any[] = [];

  VIETNAM_CLUSTERS.forEach((cluster) => {
    // 2-5 shelters per cluster
    const count = 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const coords = randomCoordinatesInCluster(cluster.lat, cluster.lng, 3); // Closer to center
      const type = weightedRandom(
        [ENUM_SHELTER_TYPE.SCHOOL, ENUM_SHELTER_TYPE.COMMUNITY_CENTER, ENUM_SHELTER_TYPE.GYM, ENUM_SHELTER_TYPE.PAGODA, ENUM_SHELTER_TYPE.CHURCH, ENUM_SHELTER_TYPE.OTHER],
        [30, 30, 10, 10, 10, 10]
      );

      const baseName = SHELTER_NAMES[Math.floor(Math.random() * SHELTER_NAMES.length)];
      const name = `${baseName} ${faker.address.streetName()}`;

      shelters.push({
        name,
        type,
        status: ENUM_SHELTER_STATUS.ACTIVE,
        location: {
          type: ENUM_REPORT_LOCATION_TYPE.POINT,
          coordinates: [coords.lng, coords.lat],
        },
        address: faker.address.streetAddress(true) + `, ${cluster.name}`,
        regionId: cluster.regionId,
        capacity: 50 + Math.floor(Math.random() * 450),
        currentOccupancy: Math.floor(Math.random() * 50),
        contactPerson: faker.name.fullName(),
        contactPhone: randomPhoneNumber(),
        description: faker.lorem.sentence(),
        images: [],
        facilities: {
          electricity: Math.random() > 0.1,
          water: Math.random() > 0.1,
          medical: Math.random() > 0.3,
          kitchen: Math.random() > 0.2,
          restroom: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  });

  const createdShelters = await shelterModel.insertMany(shelters);
  console.log(`✅ Created ${createdShelters.length} shelters across ${VIETNAM_CLUSTERS.length} regions`);
  return createdShelters as ShelterDocument[];
}


// ==================== MAIN ====================

async function bootstrap() {
  console.log('🚀 Starting data seeding...\n');

  const { emailDomain, userCount } = parseArgs();

  console.log('📋 Configuration:');
  console.log(`   - Email domain: ${emailDomain}`);
  console.log(`   - User count: ${userCount}`);
  console.log(`   - Date range: 30 days ago to now`);
  console.log(`   - Geographic clusters: ${VIETNAM_CLUSTERS.length}`);

  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(UserEntity.name, DATABASE_CONNECTION_NAME));
  const reportModel = app.get<Model<ReportDocument>>(getModelToken(ReportEntity.name, DATABASE_CONNECTION_NAME));
  const shelterModel = app.get<Model<ShelterDocument>>(getModelToken(ShelterEntity.name, DATABASE_CONNECTION_NAME));

  try {
    // Clear existing seed data
    console.log('\n🗑️  Clearing existing seed data...');

    const staticEmails = [
      `superadmin${emailDomain}`,
      `admin1${emailDomain}`,
      `admin2${emailDomain}`
    ];

    await userModel.deleteMany({
      $or: [
        { signUpFrom: ENUM_USER_SIGN_UP_FROM.SEED },
        { email: { $in: staticEmails } }
      ]
    });

    await reportModel.deleteMany({ source: ENUM_REPORT_SOURCE.APP, isVerified: true });
    await shelterModel.deleteMany({}); // Delete all shelters for simplicity as they are all seeded usually

    // Generate data
    const users = await generateUsers(userModel, emailDomain, userCount);
    const reports = await generateReports(reportModel, users);
    await assignVolunteersToReports(reportModel, reports, users);
    const shelters = await generateShelters(shelterModel);

    console.log('\n✨ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Total reports: ${reports.length}`);
    console.log(`   - Total shelters: ${shelters.length}`);
    console.log(`   - Default password: ${DEFAULT_PASSWORD}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   - Super Admin: superadmin${emailDomain} / ${DEFAULT_PASSWORD}`);
    console.log(`   - Admin 1: admin1${emailDomain} / ${DEFAULT_PASSWORD}`);
    console.log(`   - Admin 2: admin2${emailDomain} / ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
