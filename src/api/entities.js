import { supabase } from './supabaseClient';

// ── Entity name → Supabase table name ────────────────────────────────────────
const TABLE_MAP = {
    Achievement: 'achievements',
    AdminNote: 'admin_notes',
    BlogPost: 'blog_posts',
    BodyProgress: 'body_progress',
    ChatMessage: 'chat_messages',
    CoachPlan: 'coach_plans',
    Exercise: 'exercises',
    FeatureFlag: 'feature_flags',
    FoodItem: 'food_items',
    GroceryList: 'grocery_lists',
    MealLog: 'meal_logs',
    Mission: 'missions',
    Program: 'programs',
    Recipe: 'recipes',
    SleepLog: 'sleep_logs',
    StepLog: 'step_logs',
    SupplementLog: 'supplement_logs',
    Testimonial: 'testimonials',
    UserFeatureOverride: 'user_feature_overrides',
    UserProfile: 'user_profiles',
    UserSupplement: 'user_supplements',
    WaterLog: 'water_logs',
    WeightLog: 'weight_logs',
    WorkoutLog: 'workout_logs',
    WorkoutPlan: 'workout_plans',
    WorkoutTemplate: 'workout_templates',
    Automation: 'automations',
    Challenge: 'challenges',
    AdminTask: 'admin_tasks',
};

// ── Generic entity factory ────────────────────────────────────────────────────
function makeEntity(tableName) {
    return {

        /** Fetch all rows */
        async list(orderBy = 'created_at', ascending = false) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order(orderBy, { ascending });
            if (error) throw error;
            return data;
        },



        /**
         * Filter by exact-match object.
         * e.g. filter({ user_email: 'a@b.com', is_active: true })
         * Supports array values as .in() filters:
         * e.g. filter({ status: ['active', 'paused'] })
         */
        async filter(filters = {}, orderBy = 'created_at', ascending = false) {
            let query = supabase.from(tableName).select('*');

            Object.entries(filters).forEach(([col, val]) => {
                if (Array.isArray(val)) {
                    query = query.in(col, val);
                } else {
                    query = query.eq(col, val);
                }
            });

            query = query.order(orderBy, { ascending });
            const { data, error } = await query;
            if (error) throw error;
            return data;
        },

        /** Fetch a single row by primary key */
        async get(id) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },

        /** Insert and return the new row */
        async create(payload) {
            const { data, error } = await supabase
                .from(tableName)
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return data;
        },

        /** Update by id and return the updated row */
        async update(id, payload) {
            const { data, error } = await supabase
                .from(tableName)
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },

        /** Delete by id */
        async delete(id) {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { success: true };
        },


        async uploadFile(file, bucket = 'uploads') {
            const ext = file.name.split('.').pop();
            const path = `${tableName}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { upsert: false });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            return { file_url: data.publicUrl };
        },

        /**
         * Upsert — insert or update based on a conflict column.
         * Useful for user_profiles (one row per user_email).
         *
         * Usage:
         *   entities.UserProfile.upsert({ user_email: '...' }, 'user_email')
         */
        async upsert(payload, onConflict = 'id') {
            const { data, error } = await supabase
                .from(tableName)
                .upsert([payload], { onConflict })
                .select()
                .single();
            if (error) throw error;
            return data;
        },

    };
}

// ── Build one accessor per entity ─────────────────────────────────────────────
export const entities = Object.fromEntries(
    Object.entries(TABLE_MAP).map(([name, table]) => [name, makeEntity(table)])
);

// ── Standalone file upload helper (for non-entity contexts) ──────────────────
export async function uploadFile(file, bucket = 'uploads', folder = 'misc') {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { file_url: data.publicUrl };
}


