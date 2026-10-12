CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`company` text NOT NULL,
	`title` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`work_mode` text DEFAULT '' NOT NULL,
	`salary` text DEFAULT '' NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`jd` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'saved' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`resume_version` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`next_action` text DEFAULT '' NOT NULL,
	`follow_up_date` text DEFAULT '' NOT NULL,
	`applied_at` text DEFAULT '' NOT NULL,
	`source_note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`events` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_user_updated_idx` ON `jobs` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `jobs_user_followup_idx` ON `jobs` (`user_id`,`follow_up_date`);