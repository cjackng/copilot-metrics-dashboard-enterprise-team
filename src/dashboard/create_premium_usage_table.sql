-- DROP TABLE premium_usage_report;

CREATE TABLE premium_usage_report (
	"date" date NOT NULL,
	username varchar(255) NOT NULL,
	product varchar(100) NOT NULL,
	sku varchar(100) NOT NULL,
	model varchar(255) NOT NULL,
	quantity numeric(30, 17) NOT NULL,
	unit_type varchar(50) NOT NULL,
	applied_cost_per_quantity numeric(10, 4) NOT NULL,
	gross_amount numeric(30, 17) NOT NULL,
	discount_amount numeric(30, 17) NOT NULL,
	net_amount numeric(30, 17) NOT NULL,
	exceeds_quota bool NOT NULL,
	total_monthly_quota int4 NULL,
	organization varchar(255) NULL,
	cost_center_name varchar(255) NULL,
	create_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	team varchar(255) NULL,
	display_username varchar(255) NULL,
	update_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT premium_usage_report_uq UNIQUE (date, username, sku, model, unit_type, exceeds_quota, team)
);
CREATE INDEX idx_premium_usage_date ON premium_usage_report USING btree (date);
CREATE INDEX idx_premium_usage_model ON premium_usage_report USING btree (model);
CREATE INDEX idx_premium_usage_username ON premium_usage_report USING btree (username);