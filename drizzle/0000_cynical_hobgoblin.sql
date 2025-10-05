CREATE TABLE `session` (
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`userId` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	CONSTRAINT `session_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`type` enum('user','organization') NOT NULL,
	`name` varchar(255) NOT NULL,
	`image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_idx` UNIQUE((lower(`email`)))
);
--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;