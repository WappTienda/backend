#!/bin/bash
echo "Creating S3 bucket for ecommerce images..."
awslocal s3 mb s3://ecommerce-images
awslocal s3api put-bucket-policy --bucket ecommerce-images --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ecommerce-images/*"
    }
  ]
}'
echo "S3 bucket created successfully!"
