const ProgramOfStudy = require('../../../api-gateway/common/models/programOfStudySchema');
const Course = require('../../../api-gateway/common/models/Course');
const logger = require('../../../api-gateway/common/utils/logger');

/**
 * Check prerequisites for a selected course
 */
exports.checkPrerequisites = async (req, res) => {
    const userId  = req?.user?._id;
    const { courseId } = req.params;
    // Validate request
    if (!userId || !courseId) {
        logger.warn('Invalid request: Missing userId or courseId');
        return res.status(400).json({ message: 'userId and courseId are required' });
    }

    try {
        // Fetch the selected course
        const course = await Course.findById(courseId);
        if (!course) {
            logger.warn(`Course not found with ID: ${courseId}`);
            return res.status(404).json({ message: 'Course not found' });
        }

        // Fetch the student's program of study
        let programOfStudy = await ProgramOfStudy.findOne({ userId })
            .populate('plannedCourses.courseId', 'title credits prerequisites')
            .populate('registeredCourses', 'title credits prerequisites');

        // If the student doesn't have a program of study, create a new one
        if (!programOfStudy) {
            logger.info(`Program of study not found for user ${userId}. Creating a new one.`);
            programOfStudy = new ProgramOfStudy({
                userId,
                plannedCourses: [],
                registeredCourses: [],
                completionStatus: 'Not Started',
                totalCredits: 0,
                feedback: [],
            });
            await programOfStudy.save();
        }

        // Calculate remaining subjects and credits
        const completedCourses = programOfStudy.plannedCourses.filter(
            (course) => course.status === 'Completed'
        );
        const remainingSubjects = Math.max(10 - completedCourses.length, 0);
        const remainingCredits = Math.max(
            30 -
                completedCourses.reduce(
                    (sum, course) => sum + parseInt(course.courseId.credits || 0, 10),
                    0
                ),
            0
        );

        // If program requirements are already met
        if (remainingSubjects === 0 || remainingCredits === 0) {
            logger.info(`User ${userId} has completed program requirements.`);
            return res.status(200).json({
                eligible: false,
                remainingSubjects,
                remainingCredits,
                message: 'Program requirements already completed.',
            });
        }

        // Check prerequisites for the selected course
        const unmetPrerequisites = course.prerequisites.filter(
            (prereq) =>
                !completedCourses.some((course) => course.courseId.title === prereq) &&
                !programOfStudy.plannedCourses.some(
                    (planned) => planned.courseId.title === prereq && planned.completedExternally
                )
        );

        // Prepare response
        const response = {
            remainingSubjects,
            remainingCredits,
            eligible: unmetPrerequisites.length === 0,
            prerequisites: unmetPrerequisites,
            message:
                unmetPrerequisites.length === 0
                    ? 'You meet all prerequisites for this course.'
                    : 'You need to complete the following prerequisites before registering for this course.',
        };

        logger.info(`Prerequisite check for user ${userId} and course ${courseId}:`, response);
        return res.status(200).json(response);
    } catch (error) {
        logger.error(
            `Error checking prerequisites for user ${userId} and course ${courseId}: ${error.message}`
        );
        return res.status(500).json({ message: 'Internal server error' });
    }
};


/**
 * Mark prerequisites as completed based on student input
 */
exports.markPrerequisitesCompleted = async (req, res) => {
    const { studentId, prerequisites } = req.body;

    if (!studentId || !prerequisites || !Array.isArray(prerequisites)) {
        logger.warn('Invalid request: Missing or invalid studentId or prerequisites');
        return res.status(400).json({ message: 'studentId and valid prerequisites array are required' });
    }

    try {
        const student = await Student.findById(studentId);
        if (!student) {
            logger.warn(`Student not found: ${studentId}`);
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update completed prerequisites
        student.completedPrerequisites = [
            ...new Set([...student.completedPrerequisites, ...prerequisites]),
        ];
        await student.save();

        logger.info(`Updated prerequisites for student ${studentId}`);
        res.status(200).json({ message: 'Prerequisites marked as completed' });
    } catch (error) {
        logger.error('Error marking prerequisites as completed:', { error: error.message });
        res.status(500).json({ message: 'Internal server error' });
    }
};
