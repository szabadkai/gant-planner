import { PrismaClient } from '@prisma/client';

async function migrateToProjects() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting migration to multi-project support...');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        tasks: true,
        staff: true
      }
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      console.log(`Migrating user: ${user.email}`);
      
      // Create a default project for this user
      const projectTitle = user.projectTitle || `${user.name || user.email}'s Project`;
      
      const project = await prisma.project.create({
        data: {
          title: projectTitle,
          userId: user.id
        }
      });
      
      console.log(`  Created project: ${project.title} (${project.id})`);
      
      // Update all user's tasks to belong to this project
      if (user.tasks.length > 0) {
        await prisma.task.updateMany({
          where: { userId: user.id },
          data: { projectId: project.id }
        });
        console.log(`  Migrated ${user.tasks.length} tasks`);
      }
      
      // Update all user's staff to belong to this project
      if (user.staff.length > 0) {
        await prisma.staff.updateMany({
          where: { userId: user.id },
          data: { projectId: project.id }
        });
        console.log(`  Migrated ${user.staff.length} staff members`);
      }
      
      // Set this project as the user's current project
      await prisma.user.update({
        where: { id: user.id },
        data: { currentProjectId: project.id }
      });
      
      console.log(`  Set as current project for user`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToProjects();